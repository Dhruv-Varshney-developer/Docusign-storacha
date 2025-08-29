# Digital Signature Implementation and Document Signing — DocumentSigner

This guide explains how the **DocumentSigner** project implements digital signature collection using HTML5 canvas, manages signature data, and uploads signed documents to Storacha with IPNS tracking. It covers the complete flow from signature capture to document versioning.

## What are we building?

A digital signature system that:
- Captures user signatures using HTML5 canvas
- Validates signing authorization through UCAN delegations
- Prevents duplicate signatures from the same user
- Generates cryptographic hashes for signature verification
- Uploads signed documents with versioning to Storacha
- Maintains document history through IPNS updates

## Flow Overview

1. User provides UCAN delegation token for authorization
2. System checks if user has already signed the document
3. User draws signature on HTML5 canvas
4. System generates signature hash from PDF + signature data
5. Previous signatures are fetched from latest IPNS version
6. New signature is added to existing signature list
7. Updated signature data is packaged as PDF
8. All files are uploaded to Storacha with new CID
9. IPNS record is updated to point to new version

## 1. Signature Canvas Component — `SignatureComponent.tsx`

The main component that handles signature capture and document signing workflow.

### Core State Management

```tsx
export const SignatureBox = ({ documentId, userDid, fileName, ipnsName }: SignatureProps) => {
  const [isAuthorized, setIsAuthorized] = useState<boolean | null>(null);
  const [signing, setSigning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [signatureSaved, setSignatureSaved] = useState(false);
  const [ipnsRawKey, setIpnsRawKey] = useState("");
  const [hasAlreadySigned, setHasAlreadySigned] = useState(false);
  const [checkingSignature, setCheckingSignature] = useState(true);

  const sigPadRef = useRef<any>(null);
```

### Signature Data Structure

Each signature creates a structured data object:

```tsx
type SignatureData = {
  signer: string;           // User's DID
  signedAt: string;         // ISO timestamp
  documentId: string;       // Original document CID
  signatureHash: string;    // SHA-256 hash of PDF + signature
  fileName: string;         // Document filename
  ipnsName?: string;        // IPNS name for tracking
};
```

### Duplicate Signature Prevention

#### Initial Check on Component Mount
```tsx
useEffect(() => {
  checkExistingSignature();
}, [ipnsName, userDid]);

const checkExistingSignature = async () => {
  setCheckingSignature(true);
  try {
    const latestCID = await getLatestCID(ipnsName);
    const ipfsUrl = `https://w3s.link/ipfs/${latestCID}/signed.pdf`;
    
    const response = await fetch(ipfsUrl);
    if (!response.ok) {
      setHasAlreadySigned(false);
      return;
    }

    // Extract text from all pages of signed.pdf
    const buffer = await response.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: buffer }).promise;
    
    let allText = "";
    for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
      const page = await pdf.getPage(pageNum);
      const textContent = await page.getTextContent();
      const pageText = textContent.items.map((i: any) => i.str).join("");
      allText += pageText;
    }

    const existingSignatures: SignatureData[] = JSON.parse(allText);
    const userHasSigned = existingSignatures.some(sig => sig.signer === userDid);
    setHasAlreadySigned(userHasSigned);
    
  } catch (err) {
    console.warn("No previous signatures found:", err);
    setHasAlreadySigned(false);
  } finally {
    setCheckingSignature(false);
  }
};
```

### Signature Canvas Implementation

```tsx
<SignatureCanvas
  ref={sigPadRef}
  penColor="black"
  canvasProps={{
    width: 400,
    height: 150,
    className: `border-2 border-gray-400 rounded-md ${hasAlreadySigned ? 'opacity-50' : ''}`,
  }}
/>

<button
  onClick={() => sigPadRef.current.clear()}
  className="text-sm text-blue-600 underline cursor-pointer"
  disabled={hasAlreadySigned}
>
  Clear Signature
</button>
```

### Cryptographic Hash Generation

```tsx
async function generateHashFromPDFAndSignature(
  pdfUrl: string,
  signatureDataUrl: string
): Promise<string> {
  const pdfRes = await fetch(pdfUrl);
  const pdfArrayBuffer = await pdfRes.arrayBuffer();
  const signatureBytes = new TextEncoder().encode(signatureDataUrl);

  const combined = new Uint8Array(
    pdfArrayBuffer.byteLength + signatureBytes.byteLength
  );
  combined.set(new Uint8Array(pdfArrayBuffer), 0);
  combined.set(signatureBytes, pdfArrayBuffer.byteLength);

  const hashBuffer = await crypto.subtle.digest("SHA-256", combined);
  const hashHex = Array.from(new Uint8Array(hashBuffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
  return hashHex;
}
```

#### Hash Generation Process
1. **Fetch original PDF**: Get document content as ArrayBuffer
2. **Convert signature**: Transform canvas data URL to bytes
3. **Combine data**: Concatenate PDF bytes + signature bytes
4. **Generate SHA-256**: Create cryptographic hash of combined data
5. **Format as hex**: Convert to readable hexadecimal string

### Signature Processing Workflow

```tsx
const handleSign = async () => {
  if (hasAlreadySigned) {
    setError("You have already signed this document.");
    return;
  }

  if (sigPadRef.current.isEmpty()) {
    setError("Please provide a signature.");
    return;
  }

  setSigning(true);
  setError(null);
  setIsAuthorized(true);

  const signatureDataUrl = sigPadRef.current.getCanvas().toDataURL("image/png");

  try {
    // Generate signature entry
    const hash = await generateHashFromPDFAndSignature(
      `https://w3s.link/ipfs/${documentId}/${displayFileName}`,
      signatureDataUrl
    );

    const newEntry: SignatureData = {
      signer: userDid,
      signedAt: new Date().toISOString(),
      documentId,
      fileName: displayFileName,
      signatureHash: hash,
    };
```

### Previous Signatures Recovery

```tsx
// Try to fetch old signed.pdf
let prevSignatures: SignatureData[] = [];

try {
  // Get latest CID for the IPNS name
  const latestCID = await getLatestCID(ipnsName);
  const ipfsUrl = `https://w3s.link/ipfs/${latestCID}/signed.pdf`;

  const response = await fetch(ipfsUrl);
  if (!response.ok) throw new Error("Could not fetch signed.pdf from IPFS");

  // Extract text content from ALL pages of the PDF
  const buffer = await response.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: buffer }).promise;
  
  let allText = "";
  for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
    const page = await pdf.getPage(pageNum);
    const textContent = await page.getTextContent();
    const pageText = textContent.items.map((i: any) => i.str).join("");
    allText += pageText;
  }

  // Parse signatures from PDF text
  prevSignatures = JSON.parse(allText);
  
} catch (err) {
  console.warn("No previous signatures found:", err);
}
```

### Signature Data Packaging

```tsx
// Add new entry and regenerate PDF
const all = [...prevSignatures, newEntry];
const doc = new jsPDF();
doc.text(doc.splitTextToSize(JSON.stringify(all, null, 2), 180), 10, 10);
const blob = doc.output("blob");

const formData = new FormData();
formData.append("ipnsName", ipnsName);
formData.append("signed", new File([blob], "signed.pdf", { type: "application/pdf" }));
formData.append("resolvedCid", documentId);
```

#### Data Packaging Process
1. **Combine signatures**: Merge previous + new signature data
2. **Create PDF**: Generate new PDF containing all signature JSON
3. **Format for upload**: Package as FormData with metadata
4. **Include context**: Add IPNS name and resolved CID for tracking

### IPNS Key Management for Signing

```tsx
// IPNS Key input for republishing
<div className="w-full mt-4">
  <label className="block text-sm mb-1 font-semibold">
    Paste IPNS Key JSON
  </label>
  <textarea
    value={ipnsRawKey}
    onChange={(e) => setIpnsRawKey(e.target.value)}
    className={`w-full p-2 border text-sm rounded bg-white font-mono ${hasAlreadySigned ? 'opacity-50' : ''}`}
    rows={6}
    placeholder='{"name": "...", "key": [8, 1, 18, 64, ...]}'
    disabled={hasAlreadySigned}
  />
</div>
```

### IPNS Republishing After Signing

```tsx
try {
  const parsed = JSON.parse(ipnsRawKey);
  if (!parsed?.key || !Array.isArray(parsed.key)) {
    throw new Error("Invalid IPNS key format");
  }

  const name = await Name.from(Uint8Array.from(parsed.key));
  const publishedName = await publishToIPNS(name, json.cid);

} catch (e) {
  console.error("Failed to republish to IPNS:", e);
  setError("Failed to republish to IPNS. See console.");
}
```

## 2. Document Upload API — `signDocument/route.ts`

The backend API that handles file retrieval, bundling, and upload to Storacha.

```ts
export async function POST(req: NextRequest) {
  const form = await req.formData();
  const ipnsName = form.get("ipnsName") as string;
  const newSignedFile = form.get("signed") as File;
  const resolvedCid = form.get("resolvedCid") as string;

  if (!ipnsName || !newSignedFile || !resolvedCid) {
    return NextResponse.json({ success: false, error: "Missing inputs" }, { status: 400 });
  }
```

### File Retrieval Strategy

```ts
const fetchFile = async (filePath: string, fileName: string) => {
  // Using resolved IPFS link
  const url = `https://w3s.link/ipfs/${resolvedCid}/${filePath}`;
  const proxyUrl = `${process.env.NEXT_PUBLIC_APP_ORIGIN || "http://localhost:3002"}/api/fetch-delegation?url=${encodeURIComponent(url)}`;

  const res = await fetch(proxyUrl);
  if (!res.ok) throw new Error(`Failed to fetch ${filePath} - Status: ${res.status}`);
  const blob = await res.blob();
  return new File([blob], fileName, { type: "application/pdf" });
};
```

#### File Retrieval Process
1. **Construct IPFS URL**: Use resolved CID + file path
2. **Proxy through API**: Avoid CORS issues with proxy endpoint
3. **Validate response**: Check HTTP status codes
4. **Convert to File**: Transform blob to File object for upload

### Document Bundle Creation

```ts
try {
  // Step 1: Fetch both existing files from the resolved CID
  const [agreementFile, delegationFile] = await Promise.all([
    fetchFile("agreement.pdf", "agreement.pdf"),
    fetchFile("delegations.pdf", "delegations.pdf"),
  ]);
  
  // Step 2: Upload all files including the new signed.pdf
  const { newCid } = await uploadWithDelegation({
    agreementPdf: agreementFile,
    delegationPdf: delegationFile,
    signedPdf: newSignedFile,
  });

  return NextResponse.json({ success: true, cid: newCid });

} catch (fetchError) {
  console.error("Failed to fetch existing files:", fetchError);
  
  return NextResponse.json({ 
    success: false, 
    error: "Required files not found in IPFS.",
    code: "FILES_NOT_FOUND"
  }, { status: 404 });
}
```

### What Gets Uploaded to Storacha

Each signing operation creates a new IPFS directory containing:

#### File Structure

```
/new-cid/
├── agreement.pdf # Original document being signed
├── delegations.pdf # UCAN delegation metadata
└── signed.pdf # Cumulative signature data (JSON as PDF)

```


#### Content Details

**agreement.pdf**
- Original document content
- Unchanged throughout signing process
- Base document that signers are authorizing

**delegations.pdf**
- UCAN delegation information
- Signer permissions and time windows
- Generated during initial delegation creation

**signed.pdf**
- JSON data formatted as PDF text
- Contains all signature entries in chronological order
- Grows with each new signature
- Example content:
```json
[
  {
    "signer": "did:key:z6Mk...",
    "signedAt": "2024-01-15T10:30:00.000Z",
    "documentId": "bafybei...",
    "signatureHash": "a1b2c3d4...",
    "fileName": "contract.pdf"
  },
  {
    "signer": "did:key:z6Mk...",
    "signedAt": "2024-01-15T11:45:00.000Z",
    "documentId": "bafybei...",
    "signatureHash": "e5f6g7h8...",
    "fileName": "contract.pdf"
  }
]
```

## Document Versioning Through Signing

### Version Progression Example

```
Initial Upload:
IPNS: k51qzi5uqu5dgjzv... → CID1
├── agreement.pdf (original document)
└── delegations.pdf (UCAN metadata)
After First Signature:
IPNS: k51qzi5uqu5dgjzv... → CID2
├── agreement.pdf (same)
├── delegations.pdf (same)
└── signed.pdf (1 signature)
After Second Signature:
IPNS: k51qzi5uqu5dgjzv... → CID3
├── agreement.pdf (same)
├── delegations.pdf (same)
└── signed.pdf (2 signatures)
Final State:
IPNS: k51qzi5uqu5dgjzv... → CID4
├── agreement.pdf (same)
├── delegations.pdf (same)
└── signed.pdf (all signatures)
```


### Signature Verification Process

Each signature can be verified by:
1. **Hash verification**: Regenerate hash from PDF + signature data
2. **DID validation**: Confirm signer identity through UCAN delegation
3. **Timestamp validation**: Check signing occurred within authorized window
4. **Document integrity**: Ensure PDF content matches original

## Error Handling and Edge Cases

### Duplicate Signature Prevention
```tsx
if (hasAlreadySigned) {
  setError("You have already signed this document.");
  return;
}
```

### Canvas Validation
```tsx
if (sigPadRef.current.isEmpty()) {
  setError("Please provide a signature.");
  return;
}
```

### File Availability Checks
```ts
if (!response.ok) throw new Error("Could not fetch signed.pdf from IPFS");
```

### IPNS Key Validation
```tsx
const parsed = JSON.parse(ipnsRawKey);
if (!parsed?.key || !Array.isArray(parsed.key)) {
  throw new Error("Invalid IPNS key format");
}
```

## Security Considerations

### Signature Integrity
- **Canvas to PNG**: High-quality signature capture
- **Cryptographic hashing**: SHA-256 for tamper detection
- **PDF + signature binding**: Hash includes both document and signature

### Access Control
- **UCAN validation**: Only authorized signers can sign
- **Time-based restrictions**: Signatures only valid during authorized windows
- **DID verification**: Cryptographic proof of signer identity

### Data Persistence
- **IPFS immutability**: Previous versions remain accessible
- **IPNS updates**: Consistent access point for latest version
- **Local key storage**: Private keys never leave user's device

## Usage Flow

1. **Authorize**: User provides valid UCAN delegation token
2. **Verify eligibility**: System checks if user can sign and hasn't already
3. **Capture signature**: User draws signature on canvas
4. **Generate proof**: System creates cryptographic hash
5. **Merge data**: New signature added to existing signature list
6. **Upload bundle**: All files uploaded to Storacha with new CID
7. **Update IPNS**: Name points to new version
8. **Confirm completion**: User receives confirmation of successful signing

This digital signature system ensures that each signing action is properly authorized, cryptographically verified, and permanently recorded in a decentralized, tamper-proof manner.