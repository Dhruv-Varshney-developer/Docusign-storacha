"use client";

import { useState, useEffect } from "react";
import { Worker, Viewer } from "@react-pdf-viewer/core";
import { defaultLayoutPlugin } from "@react-pdf-viewer/default-layout";
import { pageNavigationPlugin } from "@react-pdf-viewer/page-navigation";
import { toolbarPlugin } from "@react-pdf-viewer/toolbar";
import { fullScreenPlugin } from "@react-pdf-viewer/full-screen";
import "@react-pdf-viewer/core/lib/styles/index.css";
import "@react-pdf-viewer/default-layout/lib/styles/index.css";
import "@react-pdf-viewer/page-navigation/lib/styles/index.css";
import "@react-pdf-viewer/toolbar/lib/styles/index.css";
import "@react-pdf-viewer/full-screen/lib/styles/index.css";
import {
  Eye,
  AlertCircle,
  Loader2,
  FileText,
  ExternalLink,
  Calendar,
  HardDrive,
  File,
} from "lucide-react";

interface DocumentMetadata {
  cid: string;
  size?: number;
  filename?: string;
  uploadDate?: string;
  contentType?: string;
  links?: Array<{ Name: string; Size: number; Hash: string }>;
}

interface PDFViewerProps {
  fileUrl?: string;
  height?: string;
}

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
        console.log("Found CID in URL:", cidFromUrl);

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
  }, [autoLoaded]); // Only run when autoLoaded changes
  const defaultLayoutPluginInstance = defaultLayoutPlugin({
    sidebarTabs: (defaultTabs) => [],
    toolbarPlugin: {
      fullScreenPlugin: {
        enableShortcuts: true,
      },
    },
  });

  const pageNavigationPluginInstance = pageNavigationPlugin();
  const toolbarPluginInstance = toolbarPlugin();
  const fullScreenPluginInstance = fullScreenPlugin();

  // Validate CID format
  const validateCid = (cidString: string): boolean => {
    if (!cidString || cidString.length < 10) return false;

    // Basic CID validation - starts with common CID prefixes
    const cidPrefixes = ["Qm", "baf", "bag", "bah", "bai"];
    return (
      cidPrefixes.some((prefix) => cidString.startsWith(prefix)) &&
      cidString.length >= 46
    );
  };

  // Check if URL points to a PDF
  const validatePdfUrl = async (url: string): Promise<boolean> => {
    try {
      const response = await fetch(url, { method: "HEAD" });
      const contentType = response.headers.get("content-type");
      return (
        contentType?.includes("application/pdf") ||
        url.toLowerCase().endsWith(".pdf")
      );
    } catch {
      return url.toLowerCase().endsWith(".pdf");
    }
  };

  // Format file size
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  // Fetch metadata from IPFS
  const fetchMetadata = async (
    cidString: string
  ): Promise<DocumentMetadata> => {
    const metadataObj: DocumentMetadata = {
      cid: cidString,
      uploadDate: new Date().toISOString().split("T")[0], // Current date as fallback
    };

    try {
      // Try to get file info from IPFS gateway
      const response = await fetch(`https://${cidString}.ipfs.w3s.link/`, {
        method: "HEAD",
      });

      if (response.ok) {
        const contentLength = response.headers.get("content-length");
        const contentType = response.headers.get("content-type");
        const lastModified = response.headers.get("last-modified");

        if (contentLength) {
          metadataObj.size = parseInt(contentLength, 10);
        }

        if (contentType) {
          metadataObj.contentType = contentType;
        }

        if (lastModified) {
          metadataObj.uploadDate = new Date(lastModified)
            .toISOString()
            .split("T")[0];
        }
      }

      // Try to get additional info from IPFS API (may not work with all gateways)
      try {
        const apiResponse = await fetch(
          `https://ipfs.io/api/v0/object/stat?arg=${cidString}`,
          {
            method: "POST",
          }
        );

        if (apiResponse.ok) {
          const apiData = await apiResponse.json();
          if (apiData.CumulativeSize) {
            metadataObj.size = apiData.CumulativeSize;
          }
        }
      } catch (apiError) {
        // API call failed, continue with basic metadata
        console.log("IPFS API call failed, using basic metadata");
      }

      // Extract potential filename from CID (if it's a directory structure)
      metadataObj.filename = `document_${cidString.slice(-8)}.pdf`;
    } catch (error) {
      console.error("Error fetching metadata:", error);
      // Return basic metadata even if fetch fails
      metadataObj.filename = `document_${cidString.slice(-8)}.pdf`;
    }

    return metadataObj;
  };


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
      {/* CID Input Section */}
      <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-6 mb-6">
        <div className="space-y-4">
          <div>
            <label
              htmlFor="cid-input"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Enter IPFS CID to view PDF
            </label>
            <div className="relative">
              <input
                id="cid-input"
                type="text"
                value={cid}
                onChange={handleCidChange}
                placeholder="Enter CID (e.g., bafkreigypvec2wxhsyhc4q6x3vwscn36mdtt5d6odpzkagx7plfiucgfg4)"
                className={`
                  w-full px-4 py-3 pr-12 border rounded-lg text-sm transition-all duration-200 ease-in-out
                  focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500
                  ${
                    isValidCid
                      ? "border-green-300 bg-green-50"
                      : cid
                      ? "border-red-300 bg-red-50"
                      : "border-gray-300 bg-white hover:border-gray-400"
                  }
                `}
              />
              <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                {cid &&
                  (isValidCid ? (
                    <FileText className="w-5 h-5 text-green-600" />
                  ) : (
                    <AlertCircle className="w-5 h-5 text-red-500" />
                  ))}
              </div>
            </div>
            {cid && !isValidCid && (
              <p className="mt-1 text-xs text-red-600">
                Invalid CID format. CID should start with 'Qm', 'baf', 'bag',
                'bah', or 'bai'
              </p>
            )}
          </div>

          <button
            onClick={handleViewPdf}
            disabled={!isValidCid || isLoading}
            className={`
              flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-lg text-white transition-all duration-200 ease-in-out
              ${
                !isValidCid || isLoading
                  ? "bg-gray-400 cursor-not-allowed"
                  : "bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 shadow-sm hover:shadow-md"
              }
            `}
          >
            {isLoading ? (
              <>
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                Loading PDF...
              </>
            ) : (
              <>
                <Eye className="w-5 h-5 mr-2" />
                View PDF
              </>
            )}
          </button>

          {error && (
            <div className="flex items-center p-3 bg-red-50 border border-red-200 rounded-lg">
              <AlertCircle className="w-5 h-5 text-red-600 mr-2 flex-shrink-0" />
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}

          {fileUrl && !error && (
            <div className="flex items-center p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <ExternalLink className="w-5 h-5 text-blue-600 mr-2 flex-shrink-0" />
              <div className="flex-1">
                <p className="text-sm text-blue-800 font-medium">
                  PDF loaded successfully
                </p>
                <p className="text-xs text-blue-600 break-all">{fileUrl}</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Document Metadata Section */}
      {metadata && !error && (
        <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-6 mb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <File className="w-5 h-5 mr-2 text-gray-600" />
            Document Information
          </h3>

          {isLoadingMetadata ? (
            <div className="flex items-center justify-center py-4">
              <Loader2 className="w-5 h-5 animate-spin text-gray-500 mr-2" />
              <span className="text-sm text-gray-500">Loading metadata...</span>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center mb-2">
                  <FileText className="w-4 h-4 text-gray-600 mr-2" />
                  <span className="text-sm font-medium text-gray-700">
                    Filename
                  </span>
                </div>
                <p className="text-sm text-gray-900 break-all">
                  {metadata.filename || "Unknown"}
                </p>
              </div>

              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center mb-2">
                  <HardDrive className="w-4 h-4 text-gray-600 mr-2" />
                  <span className="text-sm font-medium text-gray-700">
                    File Size
                  </span>
                </div>
                <p className="text-sm text-gray-900">
                  {metadata.size ? formatFileSize(metadata.size) : "Unknown"}
                </p>
              </div>

              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center mb-2">
                  <Calendar className="w-4 h-4 text-gray-600 mr-2" />
                  <span className="text-sm font-medium text-gray-700">
                    Date
                  </span>
                </div>
                <p className="text-sm text-gray-900">
                  {metadata.uploadDate || "Unknown"}
                </p>
              </div>

              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center mb-2">
                  <ExternalLink className="w-4 h-4 text-gray-600 mr-2" />
                  <span className="text-sm font-medium text-gray-700">CID</span>
                </div>
                <p className="text-sm text-gray-900 font-mono break-all">
                  {metadata.cid.slice(0, 8)}...{metadata.cid.slice(-8)}
                </p>
              </div>
            </div>
          )}

          {metadata.contentType && (
            <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm text-blue-800">
                <span className="font-medium">Content Type:</span>{" "}
                {metadata.contentType}
              </p>
            </div>
          )}
        </div>
      )}

      {/* PDF Viewer Section */}
      {fileUrl && !error && (
        <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
          <Worker workerUrl="https://unpkg.com/pdfjs-dist@3.4.120/build/pdf.worker.min.js">
            <div style={{ height }} className="w-full">
              <Viewer
                fileUrl={fileUrl}
                plugins={[
                  defaultLayoutPluginInstance,
                  pageNavigationPluginInstance,
                  toolbarPluginInstance,
                  fullScreenPluginInstance,
                ]}
                onDocumentLoad={handleDocumentLoad}
                // onLoadError={handleDocumentError}
                theme={{
                  theme: "light",
                }}
                defaultScale={1.2}
              />
            </div>
          </Worker>
        </div>
      )}

      {/* Example CIDs for testing */}
      <div className="mt-6 p-4 bg-gray-50 border border-gray-200 rounded-lg">
        <h4 className="text-sm font-medium text-gray-700 mb-2">
          Example CIDs to try:
        </h4>
        <div className="space-y-1">
          <button
            onClick={() => {
              setCid(
                "bafkreigypvec2wxhsyhc4q6x3vwscn36mdtt5d6odpzkagx7plfiucgfg4"
              );
              setIsValidCid(true);
            }}
            className="block text-xs text-blue-600 hover:text-blue-800 font-mono bg-white px-2 py-1 rounded border hover:bg-blue-50 transition-colors"
          >
            bafkreigypvec2wxhsyhc4q6x3vwscn36mdtt5d6odpzkagx7plfiucgfg4
          </button>
        </div>
        <p className="text-xs text-gray-500 mt-2">
          Click on a CID above to auto-fill the input field
        </p>
      </div>
    </div>
  );
}


