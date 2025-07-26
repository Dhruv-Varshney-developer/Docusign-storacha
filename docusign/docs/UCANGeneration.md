# UCAN Delegation Creation Flow — Doc-Sign Role-Based Access

This guide walks you through the UCAN (User Controlled Authorization Networks) delegation creation flow in the **Doc-Sign** project. It shows how we create role-based access controls for document signing using decentralized authorization and IPNS publishing.

## What are we building?

A role-based access system that:
- Allows uploaders to create time-bound signing permissions for multiple signers
- Generates UCAN delegations with specific capabilities and deadlines
- Publishes delegation metadata to IPNS for decentralized access
- Creates downloadable PDF documentation of the delegation process

## Flow Overview

1. User (uploader) specifies number of signers and their details
2. System validates time ranges and prevents overlapping signing windows
3. UCAN delegations are created for each signer with specific capabilities
4. Delegation metadata is stored locally and published to IPNS
5. PDF documentation is generated and made available for download

## 1. Role-Based Access UI — `RoleBasedAccessComponent.tsx`

The main component that orchestrates the delegation creation process.

```tsx
export const RoleBasedAccessComponent = ({ result }: { result: any }) => {
  const [numSigners, setNumSigners] = useState(1);
  const [signers, setSigners] = useState<LocalSigner[]>([
    { did: "", capabilities: [], deadline: "", startTime: "" },
  ]);
  const [delegated, setDelegated] = useState(false);
  const [frontendInfo, setFrontendInfo] = useState(null);
```

### Key Features

- **Dynamic Signer Management**: Users can specify 1-5 signers
- **State Management**: Tracks delegation progress and stores results
- **Conditional Rendering**: Shows different UI states (form vs success)
- **Data Flow**: Passes uploaded file CID to delegation process

### What it handles

- Collecting signer information (DID, capabilities, time windows)
- Validating input before submission
- Displaying delegation results and IPNS information
- Providing secure key storage instructions

## 2. Delegation Processing — `handleSubmit.ts`

The core logic that processes signer data and creates delegations.

```ts
export const handleSubmit = async (
  e: React.FormEvent,
  signers: LocalSigner[],
  numSigners: number,
  result: any,
  setDelegated: (v: boolean) => void,
  setFrontendInfo: (info: any) => void
) => {
```

### Step-by-step process

#### Step 1: Data Validation and Sorting
```ts
const parsed = signers.map((s, idx) => ({
  ...s,
  index: idx + 1,
  start: new Date(s.startTime ?? ""),
  end: new Date(s.deadline),
}));

// Validate time ranges
for (const s of parsed) {
  if (isNaN(s.start.getTime()) || isNaN(s.end.getTime()) || s.start >= s.end) {
    errors.push(`Signer ${s.index} has invalid time range.`);
  }
}

// Check for overlapping time windows
parsed.sort((a, b) => a.start.getTime() - b.start.getTime());
for (let i = 0; i < parsed.length - 1; i++) {
  const cur = parsed[i], next = parsed[i + 1];
  if (next.start.getTime() < cur.end.getTime() + 60000) {
    errors.push(`Signer ${cur.index} and ${next.index} have overlapping times.`);
  }
}
```

#### Step 2: IPNS Key Generation
```ts
const ipnsKeyName = `ipns-${result.cid}`;
const ipnsNameObject = await ensureIPNSKeyFromScratch(ipnsKeyName);
const ipnsNameString = ipnsNameObject.toString();
```

#### Step 3: UCAN Delegation Creation
```ts
const res = await fetch("/api/delegate", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ 
    cid: result.cid, 
    name: ipnsNameString, 
    fileName: result.filename, 
    numSigners, 
    signers: formatted 
  }),
});
```

#### Step 4: Local Storage and PDF Generation
```ts
// Save delegations to localStorage
localStorage.setItem(`delegations:${result.cid}`, JSON.stringify(saved));

// Generate PDF documentation (excluding sensitive delegation data)
const doc = new jsPDF();
const savedForPdf = data.delegationResult.map((d: any) => ({
  recipientDid: d.receipientDid,
  signerName: d.signerName,
  fileName: result.filename,
  // Note: delegation excluded for security
}));
```

#### Step 5: IPNS Publishing
```ts
const formDataIPNS = new FormData();
formDataIPNS.append("ipnsName", ipnsName);
formDataIPNS.append("agreement", agreementFile);
formDataIPNS.append("delegation", new File([delegationBlob], "delegations.pdf"));

const uploadRes = await fetch("/api/delegationUpload", {
  method: "POST",
  body: formDataIPNS,
});

await publishToIPNS(ipnsNameObj, uploadJson.cid);
```

## 3. IPNS Management — `ipns.ts`

Handles IPNS key creation, storage, and publishing for persistent document access.

### Key Generation and Storage
```ts
export async function ensureIPNSKeyFromScratch(storageKey: string): Promise<Name.WritableName> {
  // Try to load existing key from localStorage
  const raw = localStorage.getItem(storageKey);
  
  if (raw) {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed.key)) {
      const keyBytes = Uint8Array.from(parsed.key);
      return await Name.from(keyBytes);
    }
  }
  
  // Create new key if none exists
  const name = await Name.create();
  const rawKeyObj = {
    name: name.toString(),
    key: Array.from(name.key.bytes),
  };
  
  localStorage.setItem(storageKey, JSON.stringify(rawKeyObj));
  return name;
}
```

### IPNS Publishing
```ts
export async function publishToIPNS(name: Name.WritableName, cid: string) {
  const value = `/ipfs/${cid}`;
  let revision;

  try {
    // Update existing record
    const current = await Name.resolve(name);
    revision = await Name.increment(current, value);
  } catch {
    // Create first record
    revision = await Name.v0(name, value);
  }

  await Name.publish(revision, name.key);
  return name.toString();
}
```

### What IPNS provides

- **Persistent URLs**: Same IPNS name always points to latest content
- **Decentralized DNS**: No central authority required
- **Version Control**: Ability to update content while maintaining same address
- **Key Recovery**: Export/import functionality for backup

## 4. UCAN Delegation API — `route.ts`

The backend API that creates actual UCAN delegations with specified capabilities.

```ts
export async function POST(req: NextRequest) {
  const { cid, name, signers, fileName } = await req.json();

  const result = await Promise.all(
    signers.map(async (item: Signer) => {
      const delegationResult = await createUCANDelegation({
        recipientDID: item.did,
        signerName: item.name,
        baseCapabilities: item.capabilities,
        deadline: Number(item.deadline),
        notBefore: item.notBefore ? Number(item.notBefore) : undefined,
        fileCID: cid,
        IPNSKeyName: name,
        fileName: fileName
      });

      return {
        receipientDid: item.did,
        signerName: item.name,
        delegationBase64ToSendToFrontend: Buffer.from(delegationResult).toString("base64"),
      };
    })
  );

  return NextResponse.json({
    success: true,
    data: { name, signers, delegationResult: result },
  });
}
```

### UCAN Delegation Details

Each delegation includes:
- **Recipient DID**: The signer's decentralized identifier
- **Capabilities**: Specific permissions (read, sign, etc.)
- **Time Bounds**: `notBefore` and `deadline` timestamps
- **Resource Context**: File CID and IPNS name for access
- **Metadata**: Signer name and file information

## Security Considerations

### Time-based Access Control
- Non-overlapping signing windows prevent conflicts
- Automatic validation ensures proper time sequencing
- 1-minute buffer between signing periods

### Data Isolation
- Sensitive delegation tokens stored locally only
- PDF documentation excludes actual delegation data
- IPNS publishing separates public metadata from private tokens

### Key Management
- IPNS keys stored in browser localStorage
- Export functionality for backup and recovery
- Clear warnings about key security importance

## Usage Example

1. **Upload a PDF** using the file uploader
2. **Configure signers** with their DIDs and time windows
3. **Generate delegations** - system creates UCAN tokens for each signer
4. **Publish to IPNS** - metadata becomes publicly accessible
5. **Share IPNS link** - signers can access their specific delegation windows

## Environment Setup

The system requires:
- Storacha client configuration for UCAN creation
- w3name library for IPNS functionality
- Browser localStorage for key persistence

No additional environment variables needed beyond the base Storacha setup.

## What you get

After successful delegation creation:
- **IPNS Name**: Persistent address for document access
- **Secret Key**: For republishing and updates (store securely!)
- **Delegation Tokens**: Individual access tokens for each signer with capabilities
- **PDF Documentation**: Downloadable record of the delegation process

This creates a complete role-based access control system where document owners can grant time-limited signing permissions to specific parties, all managed through decentralized protocols.