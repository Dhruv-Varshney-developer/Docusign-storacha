import { DocumentMetadata } from "../types/types";

// Validate CID format
export const validateCid = (cidString: string): boolean => {
  if (!cidString || cidString.length < 10) return false;

  // Basic CID validation - starts with common CID prefixes
  const cidPrefixes = ["Qm", "baf", "bag", "bah", "bai"];
  console.log(cidString);
  return (
    cidPrefixes.some((prefix) => cidString.startsWith(prefix)) &&
    cidString.length >= 46
  );
};

// Check if URL points to a PDF
export const validatePdfUrl = async (url: string): Promise<boolean> => {
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
export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
};

// Fetch metadata from IPFS
export const fetchMetadata = async (
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
