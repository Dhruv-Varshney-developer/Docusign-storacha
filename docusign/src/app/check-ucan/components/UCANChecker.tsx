"use client";

import { useState } from "react";
import { decodeDelegation } from "@/lib/decode";
import { DecodedDelegation } from "@/types/types";
import DelegationResult from "./DelegationResult";
import { SignatureBox } from "./SignatureComponent";

export default function UCANChecker() {
  const [delegation, setDelegation] = useState("");
  const [result, setResult] = useState<DecodedDelegation | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [fileCid, setFileCid]=useState<string>("");
 

  const handleCheck = async () => {
    if (!delegation.trim()) {
      setError("Please enter a UCAN delegation");
      return;
    }

    setIsLoading(true);
    setError(null);
    setResult(null);

    try {
      const cleanedDelegation = delegation.trim().replace(/^["']|["']$/g, "");
      const decoded = await decodeDelegation(cleanedDelegation);
      setResult(decoded);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to decode UCAN delegation";
      setError(message !== "Invalid UCAN delegation format" ? message : null);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            UCAN Delegation Checker
          </h1>
          <p className="text-gray-600">
            Validate and decode UCAN delegation tokens
          </p>
        </div>

        {/* Input Section */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <div className="mb-4">
            <label
              htmlFor="delegation"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Enter UCAN Delegation (Base64)
            </label>
            <textarea
              id="delegation"
              rows={6}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none font-mono text-sm"
              placeholder="Paste your UCAN delegation here..."
              value={delegation}
              onChange={(e) => setDelegation(e.target.value)}
            />
          </div>

          <button
            onClick={handleCheck}
            disabled={isLoading || !delegation.trim()}
            className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isLoading ? (
              <div className="flex items-center justify-center">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Checking...
              </div>
            ) : (
              "Check Delegation"
            )}
          </button>
        </div>

        {/* Error Section */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg
                  className="h-5 w-5 text-red-400"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">Error</h3>
                <p className="text-sm text-red-700 mt-1">{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* Results Section */}
        {result && <DelegationResult result={result} setFile={setFileCid} />}

        {  
          result && fileCid!=="" && <SignatureBox documentId={fileCid} userDid={result.audience}/>
        }
      </div>
    </div>
  );
}
