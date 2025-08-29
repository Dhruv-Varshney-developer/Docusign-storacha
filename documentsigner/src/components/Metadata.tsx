import React from "react";
import {
  Loader2,
  FileText,
  Calendar,
  HardDrive,
  File,
  ExternalLink,
} from "lucide-react";
import { DocumentMetadata } from "@/types/types";
import { formatFileSize } from "@/utils/pdfViewUtils";

interface MetadataProps {
  metadata: DocumentMetadata | null;
  isLoading: boolean;
  error: string | null;
}

export default function Metadata({
  metadata,
  isLoading,
  error,
}: MetadataProps) {
  if (!metadata || error) return null;

  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-6 mb-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
        <File className="w-5 h-5 mr-2 text-gray-600" />
        Document Information
      </h3>

      {isLoading ? (
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
              <span className="text-sm font-medium text-gray-700">Date</span>
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
  );
}
