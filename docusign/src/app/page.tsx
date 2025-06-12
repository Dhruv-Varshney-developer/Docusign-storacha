"use client";

import { useState } from "react";
import FileUploader from "@/components/FileUploader";
import UploadResult from "@/components/UploadResult";

export default function Home() {
  const [uploadResult, setUploadResult] = useState(null);
  const [error, setError] = useState<string | null>(null);

  return (
    <main className="min-h-screen flex flex-col items-center justify-center">
      <h1 className="text-3xl font-bold">Storacha PDF Upload</h1>

      {error && <p className="text-red-600 mt-2">{error}</p>}
      <FileUploader
        onUploadSuccess={(res: any) => {
          setUploadResult(res);
          setError(null);
        }}
        onUploadError={(err: string) => {
          setError(err);
          setUploadResult(null);
        }}
      />
      {uploadResult && <UploadResult result={uploadResult} />}
    </main>
  );
}
