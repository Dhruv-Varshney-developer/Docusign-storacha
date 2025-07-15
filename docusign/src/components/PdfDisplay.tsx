/* eslint-disable @typescript-eslint/no-unused-vars */
import React from "react";
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

interface PdfDisplayProps {
  fileUrl: string;
  height: string;
  onDocumentLoad: () => void;
  onDocumentError: () => void;
}

export default function PdfDisplay({
  fileUrl,
  height,
  onDocumentLoad,
  onDocumentError,
}: PdfDisplayProps) {
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

  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
      <Worker workerUrl="https://unpkg.com/pdfjs-dist@3.11.174/build/pdf.worker.min.js">
        <div style={{ height }} className="w-full">
          <Viewer
            fileUrl={fileUrl}
            plugins={[
              defaultLayoutPluginInstance,
              pageNavigationPluginInstance,
              toolbarPluginInstance,
              fullScreenPluginInstance,
            ]}
            onDocumentLoad={(e) => {
              console.log("✅ PDF loaded successfully");
              // Use setTimeout to prevent setState during render
              setTimeout(() => onDocumentLoad(), 0);
            }}
            renderError={(error) => {
              console.error("❌ PDF render error:", error);
              // Use setTimeout to prevent setState during render
              setTimeout(() => onDocumentError(), 0);
              return (
                <div className="flex items-center justify-center h-full bg-red-50 text-red-600">
                  <div className="text-center">
                    <p className="text-lg font-semibold mb-2">Error loading PDF</p>
                    <p className="text-sm">The document may be corrupted or not accessible.</p>
                    <p className="text-xs mt-2 text-gray-500">URL: {fileUrl}</p>
                  </div>
                </div>
              );
            }}
            theme={{
              theme: "light",
            }}
            defaultScale={1.2}
          />
        </div>
      </Worker>
    </div>
  );
}
