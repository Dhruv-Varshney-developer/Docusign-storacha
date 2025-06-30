// components/SignatureBox.tsx
"use client";

import PDFViewer from "@/components/PdfViewer";
import { useState } from "react";


type SignatureProps = {
  documentId: string;
  // onSigned: (signature: SignatureData) => void;
};

type SignatureData = {
  signer: string;
  signedAt: string;
  documentId: string;
};

export const SignatureBox=({ documentId}: SignatureProps)=> {
  const [isAuthorized, setIsAuthorized] = useState<boolean | null>(null);
  const [signing, setSigning] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSign = async () => {
    setSigning(true);
    setError(null);

    setIsAuthorized(true);

    const signature: SignatureData = {
      signer: "user@example.com",
      signedAt: new Date().toISOString(),
      documentId,
    };

    console.log("Saving signature:", signature);
    setSigning(false);
  };

  return (
    <div className="p-4 border rounded shadow flex flex-col items-center ">
      <PDFViewer fileUrl={`https://${documentId}.ipfs.w3s.link/`} signer={true}/>
      <h2 className="text-xl font-bold mb-2 mt-4">Sign this document</h2>
      {isAuthorized === false && <p className="text-red-500">{error}</p>}
      <button
        onClick={handleSign}
        className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 w-[30%]"
        disabled={signing}
      >
        {signing ? "Signing..." : "Sign Document"}
      </button>
    </div>
  );
}
