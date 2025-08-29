# UCAN Delegation Decoding and Validation Flow — DocumentSigner

This guide walks you through how the **DocumentSigner** project decodes UCAN delegation tokens, validates their time constraints, and enables sequence-based signing workflows. It covers the complete flow from raw Base64 tokens to structured validation results.

## What are we building?

A delegation validation system that:
- Decodes Base64 UCAN delegation tokens into readable format
- Validates time-based constraints (notBefore, expiration)
- Resolves IPNS names to get latest document versions
- Enables sequence-based signing workflows
- Provides delegation status verification

## Flow Overview

1. User inputs a Base64 UCAN delegation token
2. System decodes the token and extracts delegation details
3. Time-based validation checks current access permissions
4. IPNS resolution fetches the latest document version
5. Sequence validation ensures proper signing order

## 1. UCAN Checker Interface — `UCANChecker.tsx`

The main component that handles delegation input and orchestrates the validation process.

### Delegation Processing Flow

#### Step 1: Input Sanitization and Validation
```tsx
const handleCheck = async () => {
  if (!delegation.trim()) {
    setError("Please enter a UCAN delegation");
    return;
  }

  // Clean the input by removing quotes and whitespace
  const cleanedDelegation = delegation.trim().replace(/^["']|["']$/g, "");
  const decoded: DecodedDelegation = await decodeDelegation(cleanedDelegation);
```

#### Step 2: CID Extraction and Processing
```tsx
// Extract and set fileCid properly
if (decoded?.nb?.cid) {
  let extractedCid = decoded.nb.cid;
  
  // If the CID is a JSON string, parse it to get the root CID
  if (typeof extractedCid === 'string' && extractedCid.startsWith('{')) {
    try {
      const parsed = JSON.parse(extractedCid);
      extractedCid = parsed.root?.["/"] || extractedCid;
    } catch (e) {
      console.warn("Failed to parse CID JSON:", e);
    }
  }
  
  setFileCid(extractedCid);
}
```

#### Step 3: IPNS Resolution for Latest Content
```tsx
if (decoded?.nb?.ipnsKeyName) {
  setIpnsKeyName(decoded.nb.ipnsKeyName);
  
  setIsResolvingIPNS(true);
  try {
    const resolvedCid = await getLatestCID(decoded.nb.ipnsKeyName);
    setLatestCid(resolvedCid);
  } catch (ipnsError) {
    console.warn("⚠️ Failed to resolve IPNS:", ipnsError);
    // Use original CID as fallback
  } finally {
    setIsResolvingIPNS(false);
  }
}
```

#### Step 4: Local Delegation Matching
```tsx
// Match delegation with stored local data
const stored = localStorage.getItem(`delegations:${fileCid}`);
if (stored) {
  const delegationArray = JSON.parse(stored);
  const matchedDelegation = delegationArray.find(
    (item) => item.recipientDid === result.audience
  );
}
```

## 2. Delegation Decoding Engine — `decode.ts`

The core logic that transforms Base64 tokens into structured delegation data.

```ts
export async function decodeDelegation(base64: string): Promise<DecodedDelegation> {
  try {
    const archiveBytes = Buffer.from(base64, "base64");
    const proof = await Delegation.extract(archiveBytes);

    if (!proof.ok) {
      throw new Error("Invalid UCAN delegation format");
    }
```

### Delegation Structure Extraction

#### Basic Information Parsing
```ts
const audience = proof.ok.audience.did();
const issuer = proof.ok.issuer.did();
const capabilities = proof.ok.capabilities;
const expiration = new Date(proof.ok.expiration * 1000);
const notBefore = proof.ok?.notBefore 
  ? new Date(proof.ok.notBefore * 1000) 
  : undefined;
```

#### Time-based Validation Logic
```ts
// Check validity based on current time
const now = new Date();
let status: "valid" | "expired" | "not-yet-valid" = "valid";
let isValid = true;

if (notBefore && now < notBefore) {
  status = "not-yet-valid";
  isValid = false;
} else if (now > expiration) {
  status = "expired";
  isValid = false;
}
```

#### Metadata Extraction
```ts
const nb = capabilities[0]?.nb ?? {};

// Extract signer name from meta
const signerName = capabilities[0]?.nb?.meta?.signerName || undefined;

return {
  audience,
  issuer,
  capabilities,
  expiration,
  notBefore,
  isValid,
  status,
  nb,
  signerName
};
```

### Delegation Status Types

The system recognizes three delegation states:

- **`valid`**: Current time is within the allowed signing window
- **`expired`**: Current time is past the expiration timestamp
- **`not-yet-valid`**: Current time is before the notBefore timestamp

## Sequence-Based Signing Validation

The system enforces proper signing order through time-based constraints:

### Non-Overlapping Windows
- Each signer gets a specific time window defined by `notBefore` and `expiration`
- System validates that signing windows don't overlap
- 1-minute buffer enforced between consecutive signing periods

### Automatic Status Detection
```ts
// Current delegation status determines available actions
const now = new Date();

if (notBefore && now < notBefore) {
  // Signer must wait for their turn
  status = "not-yet-valid";
} else if (now > expiration) {
  // Signing window has passed
  status = "expired"; 
} else {
  // Currently authorized to sign
  status = "valid";
}
```

### CID Resolution Logic
The system handles both direct CIDs and nested JSON structures:

```ts
const getContentCID = (fileCid: string) => {
  try {
    const parsed = JSON.parse(fileCid);
    if (parsed.root && parsed.root["/"]) {
      return JSON.stringify(parsed, null, 2);
    }
  } catch (e) {
    // Return original if parsing fails
  }
  return fileCid;
}
```

## Security Considerations

### Token Validation
- Base64 format validation before processing
- UCAN signature verification through w3up-client
- Capability constraint verification

### Time-based Access Control
- Server-side timestamp validation
- Client-side real-time status updates
- Automatic expiration enforcement

### Data Privacy
- Sensitive delegation data stays in localStorage
- IPNS resolution provides current document access
- No delegation tokens stored on servers

## Error Handling Patterns

### Common Error Scenarios
```ts
try {
  const decoded = await decodeDelegation(cleanedDelegation);
  setResult(decoded);
} catch (err) {
  const message = err instanceof Error 
    ? err.message 
    : "Failed to decode UCAN delegation";
  setError(message !== "Invalid UCAN delegation format" ? message : null);
}
```

### Validation Flow
- Invalid format detection
- Network failure handling
- Missing delegation data warnings
- IPNS resolution failures

## Usage Flow

1. **Obtain Delegation**: Signer receives Base64 delegation token from document owner
2. **Input Token**: Paste delegation into the checker interface
3. **Validation**: System decodes and validates time constraints
4. **Document Access**: IPNS resolution fetches current document version
5. **Status Check**: System determines whether delegation is currently valid
6. **Signing Action**: If valid, signing interface becomes available

## What You Get

After successful delegation decoding:
- **Delegation Status**: Current validity (valid/expired/not-yet-valid)
- **Time Windows**: Validation of when signing is allowed
- **Document Access**: Direct link to current document version
- **Signer Identity**: Name and DID of authorized signer
- **Capability Details**: Specific permissions granted

This creates a complete validation system where signers can verify their authorization status and access documents at the appropriate time in the signing sequence.