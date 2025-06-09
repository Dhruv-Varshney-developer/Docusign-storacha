import React from "react";
import {
  Eye,
  AlertCircle,
  Loader2,
  FileText,
  ExternalLink,
} from "lucide-react";

interface CidInputProps {
  cid: string;
  setCid: (cid: string) => void;
  isValidCid: boolean;
  isLoading: boolean;
  error: string | null;
  fileUrl: string;
  onViewPdf: () => void;
  onCidChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

export default function CidInput({
  cid,
  setCid,
  isValidCid,
  isLoading,
  error,
  fileUrl,
  onViewPdf,
  onCidChange,
}: CidInputProps) {
  return (
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
              onChange={onCidChange}
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
        </div>

        <button
          onClick={onViewPdf}
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

      {/* Example CIDs for testing */}
      <div className="mt-6 p-4 bg-gray-50 border border-gray-200 rounded-lg">
        <h4 className="text-sm font-medium text-gray-700 mb-2">
          Example CIDs to try:
        </h4>
        <div className="space-y-1">
          <button
            onClick={() => {
              const exampleCid =
                "bafkreigypvec2wxhsyhc4q6x3vwscn36mdtt5d6odpzkagx7plfiucgfg4";
              setCid(exampleCid);
              const event = {
                target: { value: exampleCid },
              } as React.ChangeEvent<HTMLInputElement>;
              onCidChange(event);
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
