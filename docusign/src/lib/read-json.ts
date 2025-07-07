import * as pdfjsLib from 'pdfjs-dist/legacy/build/pdf.js';

// ✅ Set this BEFORE getDocument
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

export async function extractJsonFromPdf(ipnsUrl: string) {
    const response = await fetch('/api/fetch-delegation');
    if (!response.ok) throw new Error(`Failed to fetch PDF: ${response.status}`);

    const pdfData = await response.arrayBuffer();
    console.log("pdf data", pdfData);

    // ✅ Use correct worker-enabled loading
    const pdf = await pdfjsLib.getDocument({ data: pdfData }).promise;

    const page = await pdf.getPage(1);
    const content = await page.getTextContent();
    const text = content.items.map((item: any) => item.str).join(' ');

    console.log("Extracted PDF text:", text);
}
