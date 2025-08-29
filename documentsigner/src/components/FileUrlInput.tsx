import React from "react";
import {
  Eye,
  AlertCircle,
  Loader2,
  ExternalLink,
} from "lucide-react";

interface FileUrlInputProps {
  fileUrl: string;
  setFileUrl: (url: string) => void;
  isLoading: boolean;
  error: string | null;
  onViewPdf: () => void;
  onFileUrlChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

export default function FileUrlInput({
  fileUrl,
  setFileUrl,
  isLoading,
  error,
  onViewPdf,
  onFileUrlChange,
}: FileUrlInputProps) {
  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-6 mb-6">
      <div className="space-y-4">
        <div>
          <label
            htmlFor="file-url-input"
            className="block text-sm font-medium text-gray-700 mb-2"
          >
            Enter IPFS File URL
          </label>
          <div className="relative">
            <input
              id="file-url-input"
              type="text"
              value={fileUrl}
              onChange={onFileUrlChange}
              placeholder="e.g. https://w3s.link/ipfs/<cid>/<file.pdf>"
              className={`
                w-full px-4 py-3 pr-12 border rounded-lg text-sm transition-all duration-200 ease-in-out
                focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500
                ${fileUrl ? "border-green-300 bg-green-50" : "border-gray-300 bg-white"}
              `}
            />
          </div>
        </div>

        <button
          onClick={onViewPdf}
          disabled={!fileUrl || isLoading}
          className={`
            flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-lg text-white transition-all duration-200 ease-in-out
            ${!fileUrl || isLoading
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

      <div className="mt-6 p-4 bg-gray-50 border border-gray-200 rounded-lg">
        <h4 className="text-sm font-medium text-gray-700 mb-2">
          Example IPFS PDF Links
        </h4>

        {/* w3s.link Example */}
        <div className="mb-4">
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                const url =
                  "https://w3s.link/ipfs/bafybeigoqucdu7mydkntsxahngufghuwgsry4vmby3zirokloqmkrdsrue/attention-is-all-you-need.pdf";
                setFileUrl(url);
                const event = {
                  target: { value: url },
                } as React.ChangeEvent<HTMLInputElement>;
                onFileUrlChange(event);
              }}
              className="text-xs text-blue-600 hover:text-blue-800 font-mono bg-white px-3 py-1.5 rounded border border-blue-200 hover:bg-blue-50 transition-colors"
            >
              Autofill (w3s.link)
            </button>
            <button
              onClick={async () => {
                const url =
                  "https://w3s.link/ipfs/bafybeigoqucdu7mydkntsxahngufghuwgsry4vmby3zirokloqmkrdsrue/attention-is-all-you-need.pdf";
                await navigator.clipboard.writeText(url);
                alert("Copied to clipboard!");
              }}
              className="text-xs text-gray-700 hover:text-gray-900 font-mono bg-white px-3 py-1.5 rounded border border-gray-300 hover:bg-gray-100 transition-colors"
            >
              Copy
            </button>
          </div>
          <p className="text-xs text-gray-500 mt-1 break-all ml-[2px]">
            https://w3s.link/ipfs/bafybeigoqucdu7mydkntsxahngufghuwgsry4vmby3zirokloqmkrdsrue/attention-is-all-you-need.pdf
          </p>
        </div>

        {/* ipfs.io Example */}
        <div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                const url =
                  "https://ipfs.io/ipfs/bafybeigoqucdu7mydkntsxahngufghuwgsry4vmby3zirokloqmkrdsrue/attention-is-all-you-need.pdf";
                setFileUrl(url);
                const event = {
                  target: { value: url },
                } as React.ChangeEvent<HTMLInputElement>;
                onFileUrlChange(event);
              }}
              className="text-xs text-blue-600 hover:text-blue-800 font-mono bg-white px-3 py-1.5 rounded border border-blue-200 hover:bg-blue-50 transition-colors"
            >
              Autofill (ipfs.io)
            </button>
            <button
              onClick={async () => {
                const url =
                  "https://ipfs.io/ipfs/bafybeigoqucdu7mydkntsxahngufghuwgsry4vmby3zirokloqmkrdsrue/attention-is-all-you-need.pdf";
                await navigator.clipboard.writeText(url);
                alert("Copied to clipboard!");
              }}
              className="text-xs text-gray-700 hover:text-gray-900 font-mono bg-white px-3 py-1.5 rounded border border-gray-300 hover:bg-gray-100 transition-colors"
            >
              Copy
            </button>
          </div>
          <p className="text-xs text-gray-500 mt-1 break-all ml-[2px]">
            https://ipfs.io/ipfs/bafybeigoqucdu7mydkntsxahngufghuwgsry4vmby3zirokloqmkrdsrue/attention-is-all-you-need.pdf
          </p>
        </div>
      </div>
    </div>
  );
}

