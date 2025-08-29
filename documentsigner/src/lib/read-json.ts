import * as pdfjsLib from 'pdfjs-dist/legacy/build/pdf.js';

pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

export async function extractJsonFromPdf(ipfsUrl: string): Promise<any> {
    const response = await fetch(`/api/fetch-delegation?url=${encodeURIComponent(ipfsUrl)}`);
    if (!response.ok) throw new Error(`Failed to fetch PDF: ${response.status}`);

    const pdfData = await response.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: pdfData }).promise;

    let fullText = '';

    for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
        const page = await pdf.getPage(pageNum);
        const content = await page.getTextContent();
        const text = content.items.map((item: any) => item.str).join('');
        fullText += text;
    }


    try {
        // Try parsing the full string as JSON directly
        const parsed = JSON.parse(fullText);
        return parsed;
    } catch (err) {
        console.error("Failed to parse JSON from PDF text. Full text:\n", fullText);
        throw new Error("Failed to parse JSON from PDF text");
    }
}
