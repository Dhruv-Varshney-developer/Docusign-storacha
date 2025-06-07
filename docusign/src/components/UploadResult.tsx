import { useState } from "react";
import { CheckCircle } from "lucide-react";

export default function UploadResult({ result }: any) {
  const [copied, setCopied] = useState(false);

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  return (
    <div className="w-full max-w-md mx-auto mt-6">
      <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-6 space-y-4">
        {/* Header */}
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
            <CheckCircle className="w-6 h-6 text-green-600" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">
              Upload Successful
            </h3>
            <p className="text-sm text-gray-500">
              Your file has been uploaded to IPFS
            </p>
          </div>
        </div>

        {/* File Details */}
        <div className="space-y-3">
          <div className="flex justify-between py-2 border-b border-gray-100">
            <span className="text-sm font-medium text-gray-700">Filename:</span>
            <span
              className="text-sm text-gray-900 truncate ml-2 max-w-48"
              title={result.filename}
            >
              {result.filename}
            </span>
          </div>

          <div className="flex justify-between py-2 border-b border-gray-100">
            <span className="text-sm font-medium text-gray-700">Size:</span>
            <span className="text-sm text-gray-900">
              {formatFileSize(result.size)}
            </span>
          </div>

          <div className="py-2 border-b border-gray-100">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-medium text-gray-700">CID:</span>
              <button
                onClick={() => copyToClipboard(result.cid)}
                className="text-xs text-blue-600 hover:text-blue-800 font-medium transition-colors"
              >
                {copied ? "Copied!" : "Copy"}
              </button>
            </div>
            <code className="text-xs bg-gray-100 px-2 py-1 rounded border block break-all">
              {result.cid}
            </code>
          </div>

          <div className="py-2">
            <span className="text-sm font-medium text-gray-700 block mb-2">
              IPFS URL:
            </span>
            <a
              href={"/view-pdf?cid=" + result.cid}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center px-3 py-2 text-sm font-medium text-blue-600 bg-blue-50 border border-blue-200 rounded-md hover:bg-blue-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
            >
              <svg
                className="w-4 h-4 mr-2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                />
              </svg>
              View on IPFS
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
