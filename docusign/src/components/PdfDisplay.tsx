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
            onDocumentLoad={onDocumentLoad}
            renderError={() => {
              onDocumentError();
              return <div>Error loading the document.</div>;
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
