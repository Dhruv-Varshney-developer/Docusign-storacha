# Document Signing Progress Tracking — Doc-Sign

This guide explains how the **Doc-Sign** project implements real-time tracking of document signing progress. It covers the complete flow from IPNS resolution to signature status visualization, including data extraction from PDF files and progress calculation logic.

## What are we building?

A signing progress tracking system that:
- Resolves IPNS names to get the latest document version
- Extracts delegation and signature data from PDF files stored on IPFS
- Matches signatures with authorized signers
- Calculates completion progress and displays status
- Provides real-time updates on signing workflow progress

## Flow Overview

1. User provides IPNS name for document tracking
2. System resolves IPNS to get latest CID
3. Delegation metadata extracted from delegations.pdf
4. Signature data extracted from signed.pdf (if exists)
5. Data is processed to match signatures with delegations
6. Progress calculated and status displayed with visual indicators

## 1. IPNS Resolution and Data Retrieval

The tracking system starts by resolving the IPNS name to get the current document version.

### IPNS to CID Resolution
```ts
const latestCid = await getLatestCID(ipnsName);
```

This function queries the Web3.Storage name service to get the most recent CID that the IPNS name points to, bypassing local cache issues.

### Data Source URLs
Once we have the latest CID, we construct URLs to fetch the relevant data:

```ts
const delegationsUrl = `https://w3s.link/ipfs/${latestCid}/delegations.pdf`;
const signedUrl = `https://w3s.link/ipfs/${latestCid}/signed.pdf`;
```

**delegations.pdf**: Contains metadata about who is authorized to sign
**signed.pdf**: Contains records of completed signatures (may not exist initially)

## 2. PDF Data Extraction Process

### How JSON Extraction from PDF Works

The system uses a specialized function to extract JSON data that was embedded as text in PDF files:

```ts
const delegationsData = await extractJsonFromPdf(delegationsUrl);
const signedData = await extractJsonFromPdf(signedUrl);
```

#### PDF Text Extraction Process
1. **Fetch PDF**: Download PDF file from IPFS URL
2. **Parse with PDF.js**: Use PDF.js library to read PDF structure
3. **Extract text content**: Get text from all pages of the PDF
4. **Combine pages**: Concatenate text from multiple pages if needed
5. **Parse JSON**: Convert extracted text back to JavaScript objects

#### Why PDF Storage?
- **IPFS compatibility**: PDFs are standard file formats for IPFS storage
- **Human readable**: PDFs can be opened and viewed by users
- **Data preservation**: JSON data embedded as text remains accessible
- **Version tracking**: Each PDF update creates a new IPFS hash

### Delegation Data Structure
From delegations.pdf, we extract:
```ts
interface DelegationData {
    recipientDid: string;    // Signer's DID
    signerName: string;      // Human-readable signer name
    delegation: string;      // UCAN delegation token
    fileName: string;        // Document filename
}
```

### Signature Data Structure
From signed.pdf, we extract:
```ts
interface SignedData {
    signer: string;          // Signer's DID
    signedAt: string;        // Timestamp of signature
    documentId: string;      // Document CID
    fileName: string;        // Document filename
    signatureHash: string;   // Cryptographic hash of signature
}
```

## 3. Data Processing and Matching Logic

### Signature-Delegation Matching Process

The core logic matches completed signatures with authorized delegations:

```ts
function processSigningData(
    delegations: DelegationData[],
    signatures: SignedData[],
    ipnsName: string
): ProcessedSigningData
```

#### Step 1: Create Signature Lookup Map
```ts
const signedDidsMap = new Map<string, SignedData>();
signatures.forEach(sig => {
    signedDidsMap.set(sig.signer, sig);
});
```

This creates a fast lookup structure to check if a specific DID has signed.

#### Step 2: Process Each Delegation
```ts
const processedSigners: ProcessedSigner[] = delegations.map((delegation, index) => {
    const signedData = signedDidsMap.get(delegation.recipientDid);
    
    return {
        id: index + 1,
        did: delegation.recipientDid,
        signerName: delegation.signerName || `Signer ${index + 1}`,
        fileName: delegation.fileName,
        status: signedData ? 'signed' : 'pending',
        timestamp: signedData ? signedData.signedAt : null,
        signatureHash: signedData?.signatureHash
    };
});
```

For each authorized signer (delegation), the system:
- Checks if they have a corresponding signature
- Sets status as 'signed' or 'pending'
- Includes timestamp and hash if signature exists
- Provides fallback signer name if none specified

#### Step 3: Calculate Valid Signatures
```ts
const validSignatures = signatures.filter(sig => 
    delegations.some(del => del.recipientDid === sig.signer)
);
```

This prevents counting unauthorized signatures that might exist in the data.

### Progress Calculation Logic

#### Completion Percentage
```ts
const getProgressPercentage = () => {
    if (!progressData || progressData.totalSigners === 0) return 0;
    const percentage = (progressData.currentSignatures / progressData.totalSigners) * 100;
    return Math.min(percentage, 100); // Cap at 100%
};
```

#### Progress Metrics
- **Total Signers**: Number of delegation entries (authorized signers)
- **Current Signatures**: Number of valid signatures that match delegations
- **Completion Rate**: Percentage of required signatures collected

### Status Determination Logic

Each signer gets one of three statuses:

```ts
status: 'signed' | 'pending'
```

- **signed**: Signer's DID found in signature data
- **pending**: Signer authorized but hasn't signed yet

## 4. Real-time Data Updates

### Why Latest CID Resolution Works

The tracking system always shows current progress because:

1. **IPNS Resolution**: Always gets the most recent CID
2. **Fresh Data Fetch**: Each check pulls latest files from IPFS
3. **No Local Caching**: Bypasses browser and IPFS node caches
4. **Immediate Updates**: New signatures appear as soon as IPNS is updated

### Update Propagation Flow
```
1. Signer completes signature
2. New signed.pdf uploaded to IPFS → New CID
3. IPNS record updated to point to new CID
4. Tracking page resolves IPNS → Gets new CID
5. Fetches updated signed.pdf with new signature
6. Progress automatically reflects new completion
```


## 5. Error Handling and Edge Cases

### Missing Files Handling
- **No signed.pdf**: Treated as zero signatures (normal initial state)
- **No delegations.pdf**: Error state - indicates broken delegation setup
- **IPNS resolution failure**: Network error or invalid IPNS name

### Data Validation
- **JSON parsing errors**: Malformed PDF data handled gracefully
- **Signature overflow**: System caps progress at 100% even if extra signatures exist
- **DID mismatches**: Only signatures matching delegations are counted

### Network Resilience
- **IPFS gateway failures**: Error messages guide user to retry
- **Partial data loading**: Clear indication of what data is missing
- **Timeout handling**: Reasonable timeouts for IPFS requests

## 6. Progress Visualization Logic

### Visual Status Indicators

#### Status Icons
- **Signed**: Green checkmark circle
- **Pending**: Gray clock icon
- **Error**: Red X circle (if needed)

#### Progress Bar Calculation
```ts
// Linear progress based on completion ratio
const progressWidth = (currentSignatures / totalSigners) * 100;

// Visual progression for timeline view
const signerProgress = signers.map(signer => ({
    ...signer,
    visualStatus: signer.status === 'signed' ? 'complete' : 'waiting'
}));
```

### Timeline Display Logic
For documents with ≤10 signers, a linear timeline shows:
- **Sequential nodes**: Each signer as a circle on a line
- **Progress line**: Visual connection showing completion flow
- **Status colors**: Green for signed, gray for pending
- **Hover details**: Timestamp and signature hash on signed entries

## 7. Data Flow Summary

### Complete Tracking Flow
```
User Input: IPNS Name
↓
IPNS Resolution → Latest CID
↓
Fetch delegations.pdf → Extract delegation data
↓
Fetch signed.pdf → Extract signature data (if exists)
↓
Process & Match → Create signer status list
↓
Calculate Progress → Determine completion percentage
↓
Display Results → Visual progress indicators

```


### Data Relationships

- Delegations (Who can sign) + Signatures (Who has signed) = Progress Status
- Each delegation entry represents an authorized signer
- Each signature entry represents a completed signature
- Matching DIDs between the two determines status


## 8. Performance Considerations

### Efficient Data Processing
- **Map-based lookups**: O(1) signature checking instead of O(n²) loops
- **Single IPNS resolution**: One network call to get latest CID
- **Parallel PDF fetching**: Delegations and signatures fetched simultaneously
- **Client-side processing**: All matching logic runs in browser

### Caching Strategy
- **No local caching**: Always fetch fresh data for accuracy
- **CDN benefits**: IPFS gateways provide edge caching
- **Progressive loading**: Show partial results as data arrives

## Usage Scenarios

### Document Owner Monitoring
- Track signing progress in real-time
- Identify which signers haven't completed yet
- Monitor signature timestamps for compliance

### Signer Status Checking
- Verify their signature was recorded
- See overall document completion status
- Check signature hash for verification

### Audit Trail Creation
- Complete history of signing progression
- Cryptographic proof of each signature
- Timestamped record of completion order

This tracking system provides complete visibility into the document signing process while maintaining the decentralized, verifiable nature of the UCAN-based authorization system.