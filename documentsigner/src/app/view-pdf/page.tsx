import PDFViewer from "@/components/PdfViewer";

export default function Home() {
  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            IPFS PDF Viewer
          </h1>
          <p className="text-gray-600">
            View PDF files stored on IPFS using their CID
          </p>
        </div>

        <PDFViewer height="800px" />

        <div className="mt-8 text-center text-sm text-gray-500">
          <p>Enter a valid IPFS URL above to view the PDF document</p>
        </div>
      </div>
    </div>
  );
}
