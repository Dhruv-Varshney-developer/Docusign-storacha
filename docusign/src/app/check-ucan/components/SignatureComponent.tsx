/* eslint-disable @typescript-eslint/no-unused-vars */
"use client";

import PDFViewer from "@/components/PdfViewer";
import { useState, useRef } from "react";
import SignatureCanvas from "react-signature-canvas";
import jsPDF from "jspdf";

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
      const hash = await generateHashFromPDFAndSignature(
        `https://${documentId}.ipfs.w3s.link/${fileName}`,
        signatureDataUrl
      );

      const signature: SignatureData = {
        signer: userDid,
        signedAt: new Date().toISOString(),
        documentId,
        fileName:fileName,
        signatureHash: hash,
      };

    const doc = new jsPDF();
    const jsonText = JSON.stringify(signature, null, 2); 
    const lines = doc.splitTextToSize(jsonText, 180);
    doc.text(lines, 10, 20);

    const pdfBlob = doc.output("blob");
    const file = new File(
      [pdfBlob],
      `${userDid}-${documentId}-${fileName}.pdf`,
      { type: "application/pdf" }
    );
    const formData = new FormData();
    formData.append("file", file);

    const res = await fetch("/api/upload", {
      method: "POST",
      body: formData,
    });
    if (!res.ok) throw new Error("Upload failed");

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
        signer={true}
        onLoad={() => setDocVisible(true)}
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
