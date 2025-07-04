/* eslint-disable @typescript-eslint/no-unused-vars */
"use client";

import { useState, useEffect } from "react";
import {
  validateCid,
  validatePdfUrl,
  fetchMetadata,
} from "@/utils/pdfViewUtils";
import { DocumentMetadata, PDFViewerProps } from "@/types/types";
import FileUrlInput from "./FileUrlInput";
import Metadata from "./Metadata";
import PdfDisplay from "./PdfDisplay";

export default function PDFViewer({
  fileUrl: initialFileUrl,
  height = "750px",
}: PDFViewerProps) {
  const [cid, setCid] = useState("");
  const [fileUrl, setFileUrl] = useState(initialFileUrl || "");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isValidCid, setIsValidCid] = useState(false);
  const [metadata, setMetadata] = useState<DocumentMetadata | null>(null);
  const [isLoadingMetadata, setIsLoadingMetadata] = useState(false);
  const [autoLoaded, setAutoLoaded] = useState(false);
  const [filename, setFilename] = useState("");

  // Auto-load PDF from URL parameters
  useEffect(() => {
    const loadFromUrl = async () => {
      const urlParams = new URLSearchParams(window.location.search);
      const fileUrlParam = urlParams.get("file");

      if (fileUrlParam && !autoLoaded) {
        setAutoLoaded(true);
        setFileUrl(fileUrlParam);
        await handleViewPdf(fileUrlParam);
      }
    };
    loadFromUrl();
  }, [autoLoaded]);



  const handleUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const url = e.target.value.trim();
    setFileUrl(url);
    setCid("");
    setError(null);
    setMetadata(null);
  };


  const handleViewPdf = async (overrideUrl?: string) => {
    const url = String(overrideUrl ?? fileUrl).trim();

    if (!url) {
      setError("Please enter a valid IPFS gateway URL with filename.");
      return;
    }

    try {
      const urlObj = new URL(url);
      const pathnameParts = urlObj.pathname.split("/").filter(Boolean);

      const maybeCid = pathnameParts.includes("ipfs")
        ? pathnameParts[pathnameParts.indexOf("ipfs") + 1]
        : pathnameParts[0];

      const maybeFilename = pathnameParts[pathnameParts.length - 1];

      if (!maybeFilename.endsWith(".pdf")) {
        setError("The URL must end with a valid PDF filename.");
        return;
      }

      const isValid = await validatePdfUrl(url);
      if (!isValid) {
        setError("The URL does not point to a valid PDF file.");
        return;
      }

      setIsLoading(true);
      setIsLoadingMetadata(true);
      setError(null);
      setCid(maybeCid);
      setFilename(maybeFilename);

      const docMetadata = await fetchMetadata(maybeCid);
      setMetadata(docMetadata);
    } catch (err) {
      setError("Invalid URL or failed to fetch metadata.");
    } finally {
      setIsLoading(false);
      setIsLoadingMetadata(false);
    }
  };



  // Handle PDF document load
  const handleDocumentLoad = () => {
    setError(null);
    setIsLoading(false);
  };

  // Handle PDF load error
  const handleDocumentError = () => {
    setError(
      "Failed to load PDF document. The file may be corrupted or not accessible."
    );
    setIsLoading(false);
  };

  return (
    <div className="w-full max-w-6xl mx-auto bg-white">
      <FileUrlInput
        fileUrl={fileUrl}
        setFileUrl={setFileUrl}
        isLoading={isLoading}
        error={error}
        onViewPdf={handleViewPdf}
        onFileUrlChange={handleUrlChange}
      />


      <Metadata
        metadata={metadata}
        isLoading={isLoadingMetadata}
        error={error}
      />

      {fileUrl && !error && (
        <PdfDisplay
          fileUrl={fileUrl}
          height={height}
          onDocumentLoad={handleDocumentLoad}
          onDocumentError={handleDocumentError}
        />
      )}
    </div>
  );
}
