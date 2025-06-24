"use client";

import { useState, useEffect } from "react";
import {
  validateCid,
  validatePdfUrl,
  fetchMetadata,
} from "@/utils/pdfViewUtils";
import { DocumentMetadata, PDFViewerProps } from "@/types/types";
import CidInput from "./CidInput";
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

  // Auto-load PDF from URL parameters
  useEffect(() => {
    const loadFromUrl = async () => {
      // Get URL parameters
      const urlParams = new URLSearchParams(window.location.search);
      const cidFromUrl = urlParams.get("cid");

      if (cidFromUrl && !autoLoaded) {

        // Set the CID in the input
        setCid(cidFromUrl);

        // Validate the CID
        const isValid = validateCid(cidFromUrl);
        setIsValidCid(isValid);

        if (isValid) {
          // Auto-click the view button
          setAutoLoaded(true);
          setIsLoading(true);
          setIsLoadingMetadata(true);
          setError(null);

          try {
            const newUrl = `https://${cidFromUrl}.ipfs.w3s.link/`;

            // Validate if it's a PDF
            const isPdf = await validatePdfUrl(newUrl);
            if (!isPdf) {
              setError("The CID does not point to a PDF file");
              setIsLoading(false);
              setIsLoadingMetadata(false);
              return;
            }

            // Fetch metadata
            const docMetadata = await fetchMetadata(cidFromUrl);
            setMetadata(docMetadata);
            setIsLoadingMetadata(false);

            setFileUrl(newUrl);
          } catch (err) {
            setError("Failed to load PDF. Please check the CID and try again.");
            setIsLoadingMetadata(false);
          } finally {
            setIsLoading(false);
          }
        } else {
          setError("Invalid CID format in URL");
        }
      }
    };

    loadFromUrl();
  }, [autoLoaded]);

  const handleCidChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.trim();
    setCid(value);
    setIsValidCid(validateCid(value));
    setError(null);
    setMetadata(null);
  };

  const handleViewPdf = async () => {
    if (!cid) {
      setError("Please enter a CID");
      return;
    }

    if (!isValidCid) {
      setError("Invalid CID format");
      return;
    }

    setIsLoading(true);
    setIsLoadingMetadata(true);
    setError(null);

    try {
      const newUrl = `https://${cid}.ipfs.w3s.link/`;

      // Validate if it's a PDF
      const isPdf = await validatePdfUrl(newUrl);
      if (!isPdf) {
        setError("The CID does not point to a PDF file");
        setIsLoading(false);
        setIsLoadingMetadata(false);
        return;
      }

      // Fetch metadata
      const docMetadata = await fetchMetadata(cid);
      setMetadata(docMetadata);
      setIsLoadingMetadata(false);

      setFileUrl(newUrl);
    } catch (err) {
      setError("Failed to load PDF. Please check the CID and try again.");
      setIsLoadingMetadata(false);
    } finally {
      setIsLoading(false);
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
      <CidInput
        cid={cid}
        setCid={setCid}
        isValidCid={isValidCid}
        isLoading={isLoading}
        error={error}
        fileUrl={fileUrl}
        onViewPdf={handleViewPdf}
        onCidChange={handleCidChange}
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
