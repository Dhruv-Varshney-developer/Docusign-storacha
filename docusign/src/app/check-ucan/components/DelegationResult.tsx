"use client";

import { DecodedDelegation } from "@/types/types";
import { useState } from "react";
import { IoMdArrowDropdown } from "react-icons/io";
import { User } from "lucide-react";

interface Props {
  result: DecodedDelegation;
}

export default function DelegationResult({ result }: Props) {
  const [showDropDown, setShowDropDown] = useState<boolean>(false);
  const formatDate = (date: Date) =>
    new Intl.DateTimeFormat(navigator.language, {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      timeZoneName: "short",
    }).format(date);

  const getContentCID = (fileCid: string) => {
    try {
      const parsed = JSON.parse(fileCid);
      if (parsed.root && parsed.root["/"]) {
        return JSON.stringify(parsed, null, 2);
      }
    } catch (e) {
    }
    return fileCid;
  }

  return (
    <div className="space-y-6">
      {/* Signer Information Section */}
      {result.signerName && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center">
            <User className="w-5 h-5 text-blue-600 mr-2" />
            <div>
              <h3 className="text-lg font-medium text-blue-900">Signer Information</h3>
              <p className="text-blue-700">
                <span className="font-medium">Name:</span> {result.signerName}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Delegation Details */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 flex flex-row justify-between align-center">
          <h3 className="text-lg font-medium text-gray-900">
            Delegation Details
          </h3>
          <div
            onClick={() => setShowDropDown(!showDropDown)}
            style={{
              marginTop: "0px",
              fontSize: "25px",
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
              transform: showDropDown ? "rotate(180deg)" : "rotate(0deg)",
              transition: "transform 0.3s ease",
            }}
          >
            <IoMdArrowDropdown />
          </div>
        </div>

        {showDropDown && (
          <div className="px-6 py-4 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Issuer
                </label>
                <p className="text-sm text-gray-900 font-mono bg-gray-50 p-2 rounded break-all">
                  {result.issuer}
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Audience
                </label>
                <p className="text-sm text-gray-900 font-mono bg-gray-50 p-2 rounded break-all">
                  {result.audience}
                </p>
              </div>
            </div>

            {/* Add Signer Name in the detailed view as well */}
            {result.signerName && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Authorized Signer
                </label>
                <p className="text-sm text-gray-900 bg-gray-50 p-2 rounded">
                  {result.signerName}
                </p>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {result.notBefore && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Not Before
                  </label>
                  <p className="text-sm text-gray-900 bg-gray-50 p-2 rounded">
                    {formatDate(result.notBefore)}
                  </p>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Expiration
                </label>
                <p className="text-sm text-gray-900 bg-gray-50 p-2 rounded">
                  {formatDate(result.expiration)}
                </p>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Capabilities
              </label>
              <div className="space-y-3">
                {result.capabilities.map((capability, index) => (
                  <div
                    key={index}
                    className="bg-gray-50 border border-gray-200 rounded-lg p-4"
                  >
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
                      <div>
                        <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                          Action
                        </span>
                        <p className="text-sm font-mono text-gray-900 mt-1">
                          {capability.can}
                        </p>
                      </div>
                      <div>
                        <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                          With
                        </span>
                        <p className="text-sm font-mono text-gray-900 mt-1 break-all">
                          {capability.with}
                        </p>
                      </div>
                    </div>
                    {capability.nb && (
                      <div>
                        <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                          Constraints
                        </span>
                        <div className="mt-1 bg-white border border-gray-200 rounded p-2">
                          <pre className="text-xs text-gray-900 overflow-x-auto">
                            {getContentCID(JSON.stringify(capability.nb, null, 2))}
                          </pre>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
