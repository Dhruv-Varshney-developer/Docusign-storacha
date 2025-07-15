/* eslint-disable @typescript-eslint/no-unused-vars */
"use client";

import PDFViewer from "@/components/PdfViewer";
import { useState, useRef } from "react";
import SignatureCanvas from "react-signature-canvas";
import jsPDF from "jspdf";
import * as pdfjsLib from "pdfjs-dist/legacy/build/pdf";
import { publishToIPNS } from "@/lib/ipns";
import * as Name from 'w3name';
import { getLatestCID } from "@/lib/resolve-ipns";

pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

type SignatureProps = {
  documentId: string;
  userDid:string;
  fileName:string;
};

type SignatureData = {
  signer: string;
  signedAt: string;
  documentId: string;
  signatureHash: string;
  fileName:string;
};

export const SignatureBox = ({ documentId, userDid, fileName }: SignatureProps) => {
  const [isAuthorized, setIsAuthorized] = useState<boolean | null>(null);
  const [signing, setSigning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [docVisible, setDocVisible] = useState(false);
  const [signatureSaved, setSignatureSaved] = useState(false);
  const [ipnsRawKey, setIpnsRawKey] = useState("");

  const sigPadRef = useRef<any>(null);

  if (!ipnsName) {
    console.log("⏳ Waiting for ipnsName...");
    return null;
  }

  // Use a default filename if none provided
  const displayFileName = fileName || "document.pdf";

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
    console.log("decoded ipns name:", ipnsName);

    setSigning(true);
    setError(null);
    setIsAuthorized(true);
   const signatureDataUrl = sigPadRef.current.getCanvas().toDataURL("image/png");

    try {
      const hash = await generateHashFromPDFAndSignature(
        `https://w3s.link/ipfs/${documentId}/${displayFileName}`,
        signatureDataUrl
      );

      console.log("docuement id in signbox:", documentId);

      const newEntry: SignatureData = {
        signer: userDid,
        signedAt: new Date().toISOString(),
        documentId,
        fileName: displayFileName,
        signatureHash: hash,
      };
      console.log("error here dawg");
      console.log("decoded ipns name:", ipnsName);

      // Try to fetch old signed.pdf
      let prevSignatures: SignatureData[] = [];

      try {
        // ✅ Step 1: Get latest CID for the IPNS name
        const latestCID = await getLatestCID(ipnsName);
        console.log("decoded ipns name:", ipnsName);
        const ipfsUrl = `https://w3s.link/ipfs/${latestCID}/signed.pdf`;

        console.log("📦 Latest CID:", latestCID);
        console.log("🔗 Attempting to fetch signed.pdf from:", ipfsUrl);

        // ✅ Step 2: Fetch the PDF from IPFS (via CID)
        const response = await fetch(ipfsUrl);
        if (!response.ok) throw new Error("Could not fetch signed.pdf from IPFS");

        // ✅ Step 3: Extract text content from the PDF
        const buffer = await response.arrayBuffer();
        const pdf = await pdfjsLib.getDocument({ data: buffer }).promise;
        const firstPage = await pdf.getPage(1);
        const textContent = await firstPage.getTextContent();
        const rawText = textContent.items.map((i: any) => i.str).join("");

        // ✅ Step 4: Parse signatures from PDF text
        prevSignatures = JSON.parse(rawText);
        console.log("✅ Parsed previous signatures:", prevSignatures);
      } catch (err) {
        console.warn("⚠️ No previous signatures found or error during fetch/parse:", err);
      }

    const pdfBlob = doc.output("blob");
    const file = new File(
      [pdfBlob],
      `${userDid}-${documentId}-${fileName}.pdf`,
      { type: "application/pdf" }
    );
    const formData = new FormData();
    formData.append("file", file);

      const formData = new FormData();
      formData.append("ipnsName", ipnsName);
      formData.append("signed", new File([blob], "signed.pdf", { type: "application/pdf" }));
      formData.append("resolvedCid", documentId); // This is the resolved CID from IPNS

      console.log("📤 Sending to API:", {
        ipnsName,
        resolvedCid: documentId,
        signedFileSize: blob.size
      });

      const res = await fetch("/api/signDocument", {
        method: "POST",
        body: formData,
      });

      const json = await res.json();
      if (!json.success) {
        if (json.code === "FILES_NOT_FOUND") {
          setError("Required files not found. Please ensure the document is properly set up.");
        } else {
          throw new Error(json.error);
        }
        return;
      }

      console.log("✅ Signed and reuploaded to:", json.cid);
      setSignatureSaved(true);

      try {
        const parsed = JSON.parse(ipnsRawKey);
        if (!parsed?.key || !Array.isArray(parsed.key)) {
          throw new Error("Invalid IPNS key format");
        }

        const name = await Name.from(Uint8Array.from(parsed.key));
        const publishedName = await publishToIPNS(name, json.cid);
        console.log("📡 Republished to IPNS:", publishedName);
      } catch (e) {
        console.error("❌ Failed to republish to IPNS:", e);
        setError("Failed to republish to IPNS. See console.");
      }

    } catch (err) {
      console.error("Signature save error:", err);
      setError("Failed to save signature.");
    }

    setSigning(false);
  };

  return (
    <div className="p-4 border rounded shadow flex flex-col items-center gap-4">
      <PDFViewer
        fileUrl={`https://w3s.link/ipfs/${documentId}/agreement.pdf`}
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

      <div className="w-full mt-4">
        <label className="block text-sm mb-1 font-semibold">
          Paste IPNS Key JSON
        </label>
        <textarea
          value={ipnsRawKey}
          onChange={(e) => setIpnsRawKey(e.target.value)}
          className="w-full p-2 border text-sm rounded bg-white font-mono"
          rows={6}
          placeholder='{"name": "...", "key": [8, 1, 18, 64, ...]}'
        />
      </div>


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
