export interface DocumentMetadata {
  cid: string;
  size?: number;
  filename?: string;
  uploadDate?: string;
  contentType?: string;
  links?: Array<{ Name: string; Size: number; Hash: string }>;
}

export interface PDFViewerProps {
  fileUrl?: string;
  height?: string;
}


export interface Signer{
  did: string;
  capabilities: string[];
  deadline:string;
};