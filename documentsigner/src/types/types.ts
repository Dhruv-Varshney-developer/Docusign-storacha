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

export interface Signer {
  did: string;
  name: string; // Add this field
  capabilities: string[];
  deadline: string;
  notBefore?: string;
}

export interface DecodedDelegation {
  audience: string;
  signerName?: string;
  issuer: string;
  capabilities: any[];
  expiration: Date;
  notBefore?: Date;
  isValid: boolean;
  status: "valid" | "expired" | "not-yet-valid";
  nb: any;
}

