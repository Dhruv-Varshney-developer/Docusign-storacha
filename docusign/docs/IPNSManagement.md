# IPNS Key Management and Document Tracking — Doc-Sign

This guide explains how the **Doc-Sign** project uses IPNS (InterPlanetary Name System) for creating persistent, updatable links to documents throughout the signing process. It covers key generation, CID publishing, document tracking, and resolving the latest versions.

## What is IPNS and why do we use it?

IPNS provides mutable, cryptographically verifiable names that can point to different IPFS content over time. Unlike IPFS CIDs which are immutable, IPNS names allow us to:
- Maintain a consistent link while updating document content
- Track signing progress by publishing new versions
- Provide signers with a single URL that always shows the latest state
- Create an audit trail of document changes

## Flow Overview

1. Generate or retrieve IPNS key for document tracking
2. Upload initial document content to IPFS
3. Publish IPFS CID to IPNS name (first version)
4. After each signature, upload updated document bundle
5. Publish new CID to same IPNS name (maintaining history)
6. Resolve IPNS name to get latest CID when needed

## 1. IPNS Key Management — `ipns.ts`

The core functions for creating, storing, and managing IPNS keys.

### Key Generation and Persistence

```ts
export async function ensureIPNSKeyFromScratch(storageKey: string): Promise<Name.WritableName> {
  try {
    if (!storageKey) {
      throw new Error("IPNS storageKey is required!");
    }

    const raw = localStorage.getItem(storageKey);

    if (raw) {
      const parsed = JSON.parse(raw);

      if (Array.isArray(parsed.key)) {
        const keyBytes = Uint8Array.from(parsed.key);
        const name = await Name.from(keyBytes);
        return name;
      }
      console.warn("Malformed IPNS key. Regenerating new one.");
    }
  } catch (err) {
    console.error("Failed to load IPNS key from storage:", err);
  }

  // Fallback: create new key and persist in raw form
  const name = await Name.create();
  const rawKeyObj = {
    name: name.toString(),
    key: Array.from(name.key.bytes),
  };

  localStorage.setItem(storageKey, JSON.stringify(rawKeyObj));
  return name;
}
```

### How Key Storage Works

#### Key Structure
Each IPNS key is stored in localStorage with this structure:
```json
{
  "name": "k51qzi5uqu5dgjzv...", // IPNS name (public identifier)
  "key": [142, 8, 1, 18, 32, ...] // Private key bytes as array
}
```

#### Storage Key Pattern
```ts
const ipnsKeyName = `ipns-${result.cid}`;
```
Each document gets its own IPNS key, identified by the original file CID.

#### Key Recovery Process
1. **Check localStorage**: Look for existing key using document CID
2. **Validate format**: Ensure key bytes are properly formatted
3. **Reconstruct key**: Convert byte array back to cryptographic key
4. **Fallback creation**: Generate new key if existing one is invalid
5. **Persist immediately**: Save new keys to prevent loss

## 2. IPNS Publishing — Document Version Updates

### Publishing New Content Versions

```ts
export async function publishToIPNS(name: Name.WritableName, cid: string) {
  const value = `/ipfs/${cid}`;
  let revision;

  try {
    const current = await Name.resolve(name);
    revision = await Name.increment(current, value); // newest revision
  } catch {
    revision = await Name.v0(name, value); // first time publishing
  }

  await Name.publish(revision, name.key);

  if (!name?.key?.sign || typeof name.key.sign !== "function") {
    throw new Error("Signing key is invalid or undefined.");
  }

  return name.toString();
}
```

### Publishing Process Breakdown

#### First Publication (v0)
```ts
// When publishing to IPNS name for the first time
revision = await Name.v0(name, value);
```
- Creates the initial IPNS record
- Establishes the baseline for future updates
- Sets sequence number to 0

#### Subsequent Updates (Incremental)
```ts
// For updating existing IPNS records
const current = await Name.resolve(name);
revision = await Name.increment(current, value);
```
- Fetches current IPNS record
- Increments sequence number
- Creates new revision pointing to updated content

#### Cryptographic Signing
```ts
await Name.publish(revision, name.key);
```
- Signs the new record with private key
- Publishes to IPNS network
- Ensures only key holder can update the record

## 3. Document Tracking Through Signing Process

### How Document Updates Work

After each signature is collected, the system:

1. **Bundles Content**: Combines original document + new signatures
2. **Uploads Bundle**: Stores updated content on IPFS (new CID)
3. **Updates IPNS**: Points IPNS name to new CID
4. **Maintains History**: Previous versions remain accessible via their CIDs

### Tracking Pattern in Action

```ts
// Initial document upload
const ipnsKeyName = `ipns-${result.cid}`;
const ipnsNameObject = await ensureIPNSKeyFromScratch(ipnsKeyName);

// Upload delegation metadata and original document
const formDataIPNS = new FormData();
formDataIPNS.append("ipnsName", ipnsName);
formDataIPNS.append("agreement", agreementFile);
formDataIPNS.append("delegation", delegationBlob);

const uploadRes = await fetch("/api/delegationUpload", {
  method: "POST",
  body: formDataIPNS,
});

// Publish initial version to IPNS
await publishToIPNS(ipnsNameObj, uploadJson.cid);
```

### What Gets Tracked

Each IPNS update includes:
- **Original Document**: The base PDF being signed
- **Delegation Metadata**: Information about signers and permissions
- **Signature Data**: Collected signatures from completed signers
- **Version Information**: Timestamp and sequence data

### Signing Progression Example

```
Initial State:
IPNS: k51qzi5uqu5dgjzv... → CID1 (document + delegation info)
After Signer 1:
IPNS: k51qzi5uqu5dgjzv... → CID2 (document + delegation + signature1)
After Signer 2:
IPNS: k51qzi5uqu5dgjzv... → CID3 (document + delegation + signature1 + signature2)
Final State:
IPNS: k51qzi5uqu5dgjzv... → CID4 (complete signed document)
```


## 4. Resolving Latest Content — `resolve-ipns.ts`

### The IPFS Local-First Challenge

IPFS nodes operate on a local-first approach, meaning:
- Content is cached locally when accessed
- Updates from other nodes may not be immediately visible
- IPNS resolution can return stale data from local cache
- Direct IPFS gateway queries might show outdated versions

### Solution: External IPNS Resolution

```ts
export async function getLatestCID(ipnsName: string): Promise<string> {
    const res = await fetch(`https://name.web3.storage/name/${ipnsName}`);
    if (!res.ok) throw new Error("Failed to resolve IPNS name");

    const data = await res.json();
    const cid = data.value.replace("/ipfs/", "");
    return cid;
}
```

### Why External Resolution Works

#### Web3.Storage Name Service
- **Authoritative source**: Always returns latest published IPNS record
- **No local caching**: Bypasses local IPFS node cache issues
- **Real-time updates**: Reflects most recent IPNS publications
- **Reliable endpoint**: Dedicated service for IPNS resolution

#### Resolution Process
1. **Query name service**: `GET https://name.web3.storage/name/{ipnsName}`
2. **Parse response**: Extract CID from `/ipfs/{cid}` format
3. **Return clean CID**: Strip IPFS prefix for direct use
4. **Handle errors**: Fail gracefully if name doesn't exist

### When Resolution is Used

```ts
// In UCANChecker component
if (decoded?.nb?.ipnsKeyName) {
  setIsResolvingIPNS(true);
  try {
    const resolvedCid = await getLatestCID(decoded.nb.ipnsKeyName);
    setLatestCid(resolvedCid);
  } catch (ipnsError) {
    console.warn("⚠️ Failed to resolve IPNS:", ipnsError);
    // Fallback to original CID from delegation
  } finally {
    setIsResolvingIPNS(false);
  }
}
```

## 5. Key Import/Export for Backup

### Exporting IPNS Keys

```ts
export function exportIPNSKey(name: Name.WritableName): { name: string; key: number[] } {
  return {
    name: name.toString(),
    key: Array.from(name.key.bytes)
  };
}
```

### Importing Existing Keys

```ts
export async function importIPNSKeyFromJSON(json: string | { name: string, key: number[] }): Promise<Name.WritableName> {
  const data = typeof json === "string" ? JSON.parse(json) : json;

  if (!Array.isArray(data.key)) {
    throw new Error("IPNS key data is invalid: missing or malformed 'key' array.");
  }

  const keyBytes = Uint8Array.from(data.key);
  const name = await Name.from(keyBytes);

  // Optional: Validate reconstructed name matches data.name
  const expected = data.name;
  const actual = name.toString();
  if (expected !== actual) {
    console.warn(`⚠️ Imported name mismatch: expected ${expected}, got ${actual}`);
  }

  return name;
}
```

## Security and Persistence Considerations

### Key Security
- **Private keys stored locally**: Only in browser localStorage
- **No server-side storage**: Keys never leave user's device
- **Backup responsibility**: Users must export keys for recovery
- **Single point of control**: Only key holder can update IPNS records

### Storage Limitations
- **Browser dependency**: Keys tied to specific browser/device
- **Clear data risk**: Browser clear can lose keys permanently
- **No cloud sync**: Keys don't automatically sync across devices

## Document Lifecycle with IPNS

### Initial Setup
```
1. Upload PDF → Get CID1
2. Generate IPNS key → Get IPNS name
3. Create delegations → Package metadata
4. Upload bundle → Get CID2
5. Publish to IPNS → IPNS points to CID2
```

### Signing Progress
For each signer completion:

```
1. Collect signature data
2. Bundle with previous content
3. Upload new version → Get CIDn
4. Update IPNS record → IPNS points to CIDn
```

### Final State
```
1. All signatures collected
2. Final document bundle created
3. Last IPNS update published
4. Permanent record established
```

This IPNS-based tracking system ensures that all participants always have access to the most current version of the document while maintaining a complete audit trail of the signing process.