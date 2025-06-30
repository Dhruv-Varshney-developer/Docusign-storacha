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
  notBefore: any;
  did: string;
  capabilities: string[];
  deadline: string;
}

export interface DecodedDelegation {
  audience: string;
  issuer: string;
  capabilities: any[];
  expiration: Date;
  notBefore?: Date;
  isValid: boolean;
  status: "valid" | "expired" | "not-yet-valid";
}
