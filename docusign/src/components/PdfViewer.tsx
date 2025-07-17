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

  // Auto-load PDF when initialFileUrl is provided
  useEffect(() => {
    if (initialFileUrl && !autoLoaded) {
      setAutoLoaded(true);
      setFileUrl(initialFileUrl);
      // Use setTimeout to prevent setState during render
      setTimeout(() => handleViewPdf(initialFileUrl), 0);
    }
  }, [initialFileUrl, autoLoaded]);

  // Auto-load PDF from URL parameters
  useEffect(() => {
    const loadFromUrl = async () => {
      const urlParams = new URLSearchParams(window.location.search);
      const fileUrlParam = urlParams.get("file");

      if (fileUrlParam && !autoLoaded && !initialFileUrl) {
        setAutoLoaded(true);
        setFileUrl(fileUrlParam);
        // Use setTimeout to prevent setState during render
        setTimeout(() => handleViewPdf(fileUrlParam), 0);
      }
    };
    loadFromUrl();
  }, [autoLoaded, initialFileUrl]);

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

    // For direct PDF URLs (like from SignatureBox), skip validation
    if (initialFileUrl && url === initialFileUrl) {
      setIsLoading(true);
      setError(null);
      
      try {
        const urlObj = new URL(url);
        const pathnameParts = urlObj.pathname.split("/").filter(Boolean);
        
        const maybeCid = pathnameParts.includes("ipfs")
          ? pathnameParts[pathnameParts.indexOf("ipfs") + 1]
          : pathnameParts[0];
        
        const maybeFilename = pathnameParts[pathnameParts.length - 1];
        
        setCid(maybeCid);
        setFilename(maybeFilename);
        
      } catch (err) {
        console.warn("⚠️ URL parsing failed, but continuing:", err);
      }
      
      setIsLoading(false);
      return;
    }

    // Original validation logic for interactive use
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

      setIsLoading(true);
      setIsLoadingMetadata(true);
      setError(null);
      setCid(maybeCid);
      setFilename(maybeFilename);

      try {
        const response = await fetch(url, { method: 'HEAD' });
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
      } catch (fetchError) {
        console.warn("⚠️ PDF validation failed, but continuing anyway:", fetchError);
      }

      try {
        const docMetadata = await fetchMetadata(maybeCid);
        setMetadata(docMetadata);
      } catch (metadataError) {
        console.warn("⚠️ Metadata fetch failed:", metadataError);
        setMetadata(null);
      }

    } catch (err) {
      console.error("PDF viewer error:", err);
      setError("Invalid URL format.");
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
      {/* Only show input controls if no initial URL provided */}
      {!initialFileUrl && (
        <FileUrlInput
          fileUrl={fileUrl}
          setFileUrl={setFileUrl}
          isLoading={isLoading}
          error={error}
          onViewPdf={handleViewPdf}
          onFileUrlChange={handleUrlChange}
        />
      )}

      {!initialFileUrl && (
        <Metadata
          metadata={metadata}
          isLoading={isLoadingMetadata}
          error={error}
        />
      )}

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
