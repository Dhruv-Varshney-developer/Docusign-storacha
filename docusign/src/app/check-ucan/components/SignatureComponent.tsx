/* eslint-disable @typescript-eslint/no-unused-vars */
"use client";

import PDFViewer from "@/components/PdfViewer";
import { useState, useRef } from "react";
import SignatureCanvas from "react-signature-canvas";
import jsPDF from "jspdf";
import * as pdfjsLib from "pdfjs-dist/legacy/build/pdf";

pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

type SignatureProps = {
  documentId: string;
  userDid: string;
  fileName: string;
  ipnsName: string;
};

type SignatureData = {
  signer: string;
  signedAt: string;
  documentId: string;
  signatureHash: string;
  fileName: string;
};

export const SignatureBox = ({ documentId, userDid, fileName, ipnsName }: SignatureProps) => {
  const [isAuthorized, setIsAuthorized] = useState<boolean | null>(null);
  const [signing, setSigning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [docVisible, setDocVisible] = useState(false);
  const [signatureSaved, setSignatureSaved] = useState(false);

  // delete it later pls
  // ipnsName = "k51qzi5uqu5dinwo6uxfxse8tj33tm2tj3diefeyms5zo1jn37k055xrj83xxk";

  const sigPadRef = useRef<any>(null);

  async function generateHashFromPDFAndSignature(
    pdfUrl: string,
    signatureDataUrl: string
  ): Promise<string> {
    const pdfRes = await fetch(pdfUrl);
    const pdfArrayBuffer = await pdfRes.arrayBuffer();
    const signatureBytes = new TextEncoder().encode(signatureDataUrl);

    const combined = new Uint8Array(
      pdfArrayBuffer.byteLength + signatureBytes.byteLength
    );
    combined.set(new Uint8Array(pdfArrayBuffer), 0);
    combined.set(signatureBytes, pdfArrayBuffer.byteLength);

    const hashBuffer = await crypto.subtle.digest("SHA-256", combined);
    const hashHex = Array.from(new Uint8Array(hashBuffer))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");
    return hashHex;
  }

  const handleSign = async () => {
    if (sigPadRef.current.isEmpty()) {
      setError("Please provide a signature.");
      return;
    }

    setSigning(true);
    setError(null);
    setIsAuthorized(true);

    const signatureDataUrl = sigPadRef.current.getCanvas().toDataURL("image/png");

    try {
      // generate signature entry
      const hash = await generateHashFromPDFAndSignature(
        `https://w3s.link/ipfs/${documentId}/${fileName}`,
        signatureDataUrl
      );

      const newEntry: SignatureData = {
        signer: userDid,
        signedAt: new Date().toISOString(),
        documentId,
        fileName,
        signatureHash: hash,
      };

      // Try to fetch old signed.pdf
      let prevSignatures: SignatureData[] = [];
      try {
        const old = await fetch(`https://${ipnsName}.ipns.dweb.link/signed.pdf`);
        console.log("checking if ipnsName is what is hardcoded hehe", old);
        if (old.ok) {
          const buffer = await old.arrayBuffer();
          const pdf = await pdfjsLib.getDocument({ data: buffer }).promise;
          const content = await pdf.getPage(1).then((page) =>
            page.getTextContent().then((txt) => txt.items.map((i: any) => i.str).join(""))
          );
          prevSignatures = JSON.parse(content);
        }
      } catch (err) {
        console.log("No prior signatures found or error decoding:", err);
      }

      // Add new entry and regenerate PDF
      const all = [...prevSignatures, newEntry];
      const doc = new jsPDF();
      doc.text(doc.splitTextToSize(JSON.stringify(all, null, 2), 180), 10, 10);
      const blob = doc.output("blob");

      const formData = new FormData();
      formData.append("ipnsName", ipnsName);
      formData.append("signed", new File([blob], "signed.pdf", { type: "application/pdf" }));

      const res = await fetch("/api/signDocument", {
        method: "POST",
        body: formData,
      });

      const json = await res.json();
      if (!json.success) throw new Error(json.error);

      console.log("✅ Signed and reuploaded to:", json.cid);
      setSignatureSaved(true);
    } catch (err) {
      console.error("Signature save error:", err);
      setError("Failed to save signature.");
    }

    setSigning(false);
  };

  return (
    <div className="p-4 border rounded shadow flex flex-col items-center gap-4">
      <PDFViewer
        fileUrl={`https://w3s.link/ipfs/${documentId}/${fileName}`}
      />

      <h2 className="text-xl font-bold mt-4">Sign this document</h2>

      <SignatureCanvas
        ref={sigPadRef}
        penColor="black"
        canvasProps={{
          width: 400,
          height: 150,
          className: "border-2 border-gray-400 rounded-md",
        }}
      />
      <button
        onClick={() => sigPadRef.current.clear()}
        className="text-sm text-blue-600 underline cursor-pointer"
      >
        Clear Signature
      </button>

      {signatureSaved && (
        <p className="text-green-600">Document signed successfully!</p>
      )}

      <button
        onClick={handleSign}
        className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 w-[40%] mt-2 cursor-pointer"
        disabled={signing}
      >
        {signing ? "Signing..." : "Sign Document"}
      </button>
    </div>
  );
};
