"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { Upload, File, X, Loader2 } from "lucide-react";
import { extractJsonFromPdf } from "@/lib/read-json";
import { ensureIPNSKeyFromScratch, exportIPNSKey, importIPNSKeyFromJSON, publishToIPNS } from "@/lib/ipns";
import { getLatestCID } from "@/lib/resolve-ipns";

export default function FileUploader({ onUploadSuccess, onUploadError }: any) {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploaded, setIsUploaded] = useState(false);
  const [fileCid, setFileCid] = useState<string>("");

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  useEffect(() => {

  }, [isUploaded, fileCid])

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragOver(false);

      const droppedFiles = e.dataTransfer.files;
      if (droppedFiles.length > 0) {
        const droppedFile = droppedFiles[0];
        if (droppedFile.type === "application/pdf") {
          setFile(droppedFile);
        } else {
          onUploadError("Please select a PDF file only");
        }
      }
    },
    [onUploadError]
  );

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0] || null;
    setFile(selectedFile);
  };

  const handleBrowseClick = () => {
    fileInputRef.current?.click();
  };

  const handleRemoveFile = () => {
    setFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  async function handleSubmit(e: React.MouseEvent) {
    e.preventDefault();
    if (!file) return;

    const formData = new FormData();
    formData.append("file", file);

    try {
      setLoading(true);
      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      const result = await res.json();

      if (result.success) {
        onUploadSuccess(result.data);
        setFileCid(result.data.cid)
        setIsUploaded(true);
      } else {
        onUploadError(result.error);
      }
      if (result.success) onUploadSuccess(result.data);
      else onUploadError(result.error);
    } catch (err: any) {
      onUploadError(err.message);
    } finally {
      setLoading(false);
    }
  }

  const handleReadJSON = async () => {
    try {
      // extractJsonFromPdf("https://w3s.link/ipns/k51qzi5uqu5dhxoygw0t46r6ljhj7hnpxwguikdici5zwwur9r2dr2kkq5f8cc/delegations.pdf");
      // console.log("Extracted JSON:", result);

      const sharedExported = {
        "name": "k51qzi5uqu5dis86uiktdnl4brw3hsk8gfrn0oeu9ykh0pe86idvdgxdocz0h8",
        "key": [
          8, 1, 18, 64, 219, 17, 67, 111, 122, 135, 182, 240, 182, 204, 181, 184,
          201, 218, 84, 219, 114, 27, 193, 35, 139, 74, 169, 135, 187, 64, 46, 191,
          83, 52, 137, 245, 104, 92, 39, 181, 78, 217, 159, 3, 250, 85, 201, 237,
          17, 45, 126, 155, 132, 89, 205, 211, 248, 85, 208, 202, 27, 192, 70, 26,
          100, 57, 233, 44
        ]
      }

      const ipnsNameObj = await importIPNSKeyFromJSON(sharedExported);



      console.log("actual this i need to share", ipnsNameObj);

      const exportData = exportIPNSKey(ipnsNameObj);
      console.log("📦 Exported IPNS JSON to share:", exportData);
      const imported = await importIPNSKeyFromJSON(exportData);

      // ✅ Now publish using reconstructed key
      const publishedName = await publishToIPNS(imported, "bafkreicul7xcq4zbftx46w4brlmqud2a7n3momzqso5jst65hoftni5aki");

      console.log("✅ Published to IPNS:", publishedName);



      const ipnsName = ipnsNameObj.toString();
      if (!ipnsNameObj?.key?.bytes) {
        console.error("❌ key.bytes is undefined in ipnsNameObj");
        throw new Error("Invalid IPNS key: key.bytes is undefined.");
      }

      const secretKeyHex = Array.from(ipnsNameObj.key.bytes)
        .map((b) => b.toString(16).padStart(2, "0"))
        .join("");

      console.log("🔑 IPNS Name:", ipnsName);
      console.log("🛡️ Secret Key (Hex):", secretKeyHex);

    } catch (error) {
      console.error("Error reading JSON:", error);
      // onUploadError("Failed to read JSON file");

    }
  }

  const handleShowLatestCID = async () => {
    const ipnsName = "k51qzi5uqu5dis86uiktdnl4brw3hsk8gfrn0oeu9ykh0pe86idvdgxdocz0h8";
    try {
      const latestCid = await getLatestCID(ipnsName);
      const ipfsUrl = `https://w3s.link/ipfs/${latestCid}`;
      console.log("📦 Latest CID:", latestCid);
      console.log("🔗 IPFS URL:", ipfsUrl);

      // Show or use it anywhere
      // Example: Open in new tab
      // window.open(ipfsUrl, "_blank");
    } catch (err) {
      console.error("❌ Failed to get latest CID:", err);
    }
  };


  return (
    <div className="w-full max-w-md mx-auto">
      <div className="space-y-6">
        {/* Drag and Drop Area */}
        <div
          className={`
            relative border-2 border-dashed rounded-lg p-8 text-center transition-all duration-200 ease-in-out
            ${isDragOver
              ? "border-blue-500 bg-blue-50"
              : file
                ? "border-green-500 bg-green-50"
                : "border-gray-300 bg-white hover:border-gray-400 hover:bg-gray-50"
            }
            ${loading || isUploaded
              ? "opacity-50 pointer-events-none"
              : "cursor-pointer"
            }
          `}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={!file && !isUploaded ? handleBrowseClick : undefined}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="application/pdf"
            onChange={handleFileSelect}
            className="hidden"
            disabled={loading || isUploaded}
          />

          {!file ? (
            <div className="space-yconst result = await-4">
              <div className="mx-auto w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center">
                <Upload className="w-6 h-6 text-gray-600" />
              </div>
              <div>
                <p className="text-base font-medium text-gray-900">
                  {isDragOver ? "Drop your PDF here" : "Upload PDF file"}
                </p>
                <p className="text-sm text-gray-500 mt-1">
                  Drag and drop your file here, or{" "}
                  <span className="text-blue-600 font-medium">browse</span>
                </p>
              </div>
              <p className="text-xs text-gray-400">
                PDF files only, up to 10MB
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="mx-auto w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                <File className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <p className="text-base font-medium text-gray-900 truncate">
                  {file.name}
                </p>
                <p className="text-sm text-gray-500">
                  {formatFileSize(file.size)}
                </p>
              </div>
              <button
                type="button"
                onClick={handleRemoveFile}
                disabled={loading || isUploaded}
                className="inline-flex items-center px-3 py-1.5 text-sm font-medium text-red-600 bg-red-50 border border-red-200 rounded-md hover:bg-red-100 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <X className="w-4 h-4 mr-1" />
                Remove
              </button>
            </div>
          )}
        </div>

        {/* Upload Button */}
        <button
          type="button"
          onClick={handleSubmit}
          disabled={loading || !file || isUploaded}
          className={`
            w-full flex items-center justify-center px-4 py-3 border border-transparent text-base font-medium rounded-lg text-white transition-all duration-200 ease-in-out
            ${loading || !file
              ? "bg-gray-400 cursor-not-allowed"
              : "bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 shadow-sm hover:shadow-md"
            }
          `}
        >
          {loading ? (
            <>
              <Loader2 className="w-5 h-5 mr-2 animate-spin" />
              Uploading...
            </>
          ) : (
            <>
              <Upload className="w-5 h-5 mr-2" />
              Upload PDF
            </>
          )}
        </button>

        <button onClick={handleReadJSON}>publish (update) new</button>
        <button onClick={handleShowLatestCID}>resolve ipns</button>

      </div>
    </div>
  );
}
