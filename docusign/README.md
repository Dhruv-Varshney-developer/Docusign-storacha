# 🖋️ DocuSign on Storacha – UCAN-based Document Signing

**DocuSign on Storacha** is a full-stack demo application showcasing real-world UCAN (User Controlled Authorization Networks) capabilities using [Storacha](https://storacha.network/) for decentralized file storage and permission delegation.

This project enables secure, permissioned workflows for uploading, viewing, and signing PDF documents, using UCANs for cryptographically-verifiable, time-bound, and role-specific access control.

---

## 📖 Table of Contents

* [Overview](#overview)
* [Features](#features)
* [UCAN Concepts Demonstrated](#ucan-concepts-demonstrated)
* [Architecture & Workflow](#architecture--workflow)
* [Getting Started](#getting-started)
* [Detailed Documentation](#detailed-documentation)
* [Extending the Project](#extending-the-project)
* [Troubleshooting](#troubleshooting)
* [Contributing](#contributing)
* [License](#license)

---

## Overview

This application demonstrates how UCANs can replace traditional access control systems by delegating authority directly between users via cryptographically signed tokens. The project uses **Storacha** to store documents on IPFS, and manages sequential signing flows between users like `uploader`, `signer1`, and `signer2`.

---

## Features

### 📄 PDF Upload

* Drag-and-drop interface with file validation
* Upload to Storacha-backed IPFS storage
* CID and metadata returned post-upload
* **[📚 Detailed Guide](./docs/fileUpload.md)** - Complete PDF upload flow documentation

### 🔐 UCAN-Backed Role-Based Access

* DID-based identity and cryptographic authorization
* Role delegation: uploader, signer1, signer2 with time-bound permissions
* Sequential access enforcement through UCAN delegation chains
* **[📚 Detailed Guide](./docs/UCANGeneration.md)** - UCAN delegation creation and role management

### ✍️ Digital Signing

* Canvas-based signature capture with HTML5
* Generate SHA-256 hash of PDF + signature for verification
* Signed metadata stored as versioned PDF on IPFS
* **[📚 Detailed Guide](./docs/signature.md)** - Complete signature implementation

### 🔍 UCAN Proof Chain Viewer

* Decode Base64 UCAN delegations with validation
* Verify validity, expiration, issuer/audience relationships
* Real-time delegation status checking
* **[📚 Detailed Guide](./docs/decodeUCAN.md)** - UCAN decoding and validation

### 📊 Progress Tracking

* Real-time signing progress monitoring via IPNS
* Visual timeline for multi-signer workflows
* Signature status and completion tracking
* **[📚 Detailed Guide](./docs/track.md)** - Document tracking implementation

### 🔗 IPNS Document Management

* Persistent, updatable document links
* Version tracking through signing progression
* Decentralized naming with cryptographic verification
* **[📚 Detailed Guide](./docs/IPNSManagement.md)** - IPNS key management and publishing

---

## UCAN Concepts Demonstrated

| Concept                      | Description                                                                | Implementation |
| ---------------------------- | -------------------------------------------------------------------------- | -------------- |
| **Capability Delegation**    | UCANs define what a recipient *can* do (`can`) with what resource (`with`) | [UCANGeneration.md](./docs/UCANGeneration.md) |
| **Proof Chains**             | Each UCAN is verifiable via a chain of signed delegations                  | [decodeUCAN.md](./docs/decodeUCAN.md) |
| **Time-Bound Access**        | UCANs include `nbf` (not-before) and `exp` (expiration) timestamps         | [UCANGeneration.md](./docs/UCANGeneration.md) |
| **Revocation-by-expiry**     | Signing permission automatically invalidated after use or timeout          | [signature.md](./docs/signature.md) |
| **Sequential Authorization** | Signer1 → Signer2 enforced by chaining and timing of UCANs                 | [track.md](./docs/track.md) |
| **Verification**             | Validations for format, audience, and expiration built into viewer         | [decodeUCAN.md](./docs/decodeUCAN.md) |

---

## Architecture & Workflow

### High-Level Flow

1. **Document Upload** - PDF uploaded to Storacha, stored on IPFS with unique CID
2. **UCAN Delegation** - Document owner creates time-bound signing permissions for authorized parties
3. **IPNS Publishing** - Document metadata published to persistent IPNS name for tracking
4. **Sequential Signing** - Authorized signers complete signatures within their time windows
5. **Progress Tracking** - Real-time monitoring of signing completion status
6. **Document Versioning** - Each signature creates new IPFS version, IPNS updated automatically

### Technology Stack

- **Frontend**: Next.js 14 with App Router, TypeScript, Tailwind CSS
- **Storage**: Storacha (Web3.Storage) for IPFS integration
- **Authorization**: UCAN delegation chains with time-based constraints
- **Naming**: IPNS for persistent, updatable document links
- **Signatures**: HTML5 Canvas with cryptographic hashing (SHA-256)

---

## Getting Started

### 🧩 Prerequisites

* Node.js ≥ 18
* Yarn or npm
* Git

### Setup Instructions

#### 1. Clone the repository

```bash
git clone https://github.com/Dhruv-Varshney-developer/Docusign-storacha
cd docusign
```

#### 2. Install dependencies

```bash
npm install
# or
yarn install
```

#### 3. Set up Web3.Storage credentials

Install the storacha CLI:

```bash
npm install -g @web3-storage/w3cli
```

Then follow the steps below to generate and link your credentials:

```bash
# Log in to storacha
w3 login your@email.com

# List spaces
w3 space ls

# Select space
w3 space use <space_did>

# Create agent key (copy the output)
w3 key create

# Create a delegation and copy the output
w3 delegation create <the_did_from_previous_step> --base64

# Creates a UCAN delegation from the w3cli agent to the agent we generated above (copy output or save in proof.txt)
w3 delegation create <the_did_from_key_create> --base64 >> proof.txt
```
> **Note**: *A Space DID represents the user's data container, while an Agent DID is a delegated identity that acts on behalf of the Space to interact with Storacha*

#### 4. Create `.env` file

In the root of your project:

```env
STORACHA_KEY=<your_key_from_w3_key_create>
STORACHA_PROOF=<your_delegation_from_w3_delegation_create>
```

#### 5. Start the application

```bash
npm run dev
```

The application will be available at `http://localhost:3000`.

---

## Detailed Documentation

### 📁 Complete Implementation Guides

Our documentation provides comprehensive, step-by-step guides for each major component:

#### Core Workflows
- **[📄 File Upload Flow](./docs/fileUpload.md)** - PDF upload, validation, and Storacha integration
- **[🔐 UCAN Generation](./docs/UCANGeneration.md)** - Role-based delegation creation and time-bound permissions
- **[✍️ Digital Signatures](./docs/signature.md)** - Canvas implementation, hash generation, and document signing
- **[🔍 UCAN Decoding](./docs/decodeUCAN.md)** - Delegation validation, time constraint checking, and status verification

#### Advanced Features  
- **[🔗 IPNS Management](./docs/IPNSManagement.md)** - Key creation, publishing, and document versioning
- **[📊 Progress Tracking](./docs/track.md)** - Real-time monitoring, status visualization, and completion tracking

### 🏗️ Folder Structure 
```
src/
├── app/
│ ├── upload/ # PDF upload logic (Storacha)
│ ├── check-ucan/ # UCAN proof chain verification
│ ├── view-pdf/ # View PDF from IPFS
│ ├── status/ # Document signing progress tracking
│ └── api/
│ ├── upload/ # File upload to Storacha
│ ├── delegate/ # UCAN delegation creation
│ ├── signDocument/ # Document signing workflow
│ └── delegationUpload/ # IPNS publishing
├── components/
│ ├── FileUploader.tsx # Drag-and-drop upload interface
│ ├── PdfViewer.tsx # PDF display component
│ └── RolesComponent/ # UCAN delegation UI
├── lib/
│ ├── storacha.ts # Storacha client and UCAN logic
│ ├── ipns.ts # IPNS key management
│ ├── decode.ts # UCAN delegation decoding
│ └── resolve-ipns.ts # Latest CID resolution
└── utils/
└── fileHelpers.ts # File validation utilities
```

### 🔄 Data Flow Examples

#### Document Upload Flow
*[Complete details in fileUpload.md](./docs/fileUpload.md)*

#### UCAN Delegation Flow  
Signer Config → Time Validation → UCAN Creation → IPNS Publishing → Delegation Tokens

*[Complete details in UCANGeneration.md](./docs/UCANGeneration.md)*

#### Signing Flow
UCAN Token → Validation → Canvas Signature → Hash Generation → IPFS Upload → IPNS Update

*[Complete details in signature.md](./docs/signature.md)*

---

## Extending the Project

Here are ideas for adding more UCAN-centric functionality:

| Extension                  | Idea                                                           | Related Docs |
| -------------------------- | -------------------------------------------------------------- | ------------ |
| 🔄 **UCAN Revocation**     | Enable issuer-side revocation with updated proofs              | [UCANGeneration.md](./docs/UCANGeneration.md) |
| 🔗 **Multi-party Signing** | Add arbitrators, witnesses, or 3+ signers                      | [signature.md](./docs/signature.md) |
| 🛂 **Auditing Logs**       | Persist and show signature history on-chain/IPFS               | [track.md](./docs/track.md) |
| 🎭 **Custom Capabilities** | Define fine-grained actions (`sign`, `read`, `annotate`, etc.) | [UCANGeneration.md](./docs/UCANGeneration.md) |
| 📜 **Encrypted PDFs**      | Encrypt documents; decrypt via UCAN-constrained capability     | [fileUpload.md](./docs/fileUpload.md) |
| 🔍 **Advanced Tracking**   | Add notification systems and deadline alerts                   | [track.md](./docs/track.md) |

---

## Troubleshooting

| Problem                   | Solution                                                                 | Reference |
| ------------------------- | ------------------------------------------------------------------------ | --------- |
| 🚫 *Upload fails*          | Ensure file is `.pdf` and <10MB                                          | [fileUpload.md](./docs/fileUpload.md) |
| ⚠️ *UCAN invalid/expired* | Check Base64 formatting, audience DID, or expiration time                | [decodeUCAN.md](./docs/decodeUCAN.md) |
| ✍️ *Signature not saving* | Verify you're signing within your time slot and delegation is valid      | [signature.md](./docs/signature.md) |
| 🔗 *CID not resolving*   | IPFS propagation may take a few seconds — retry or use different gateway | [IPNSManagement.md](./docs/IPNSManagement.md) |
| 📊 *Progress not updating* | Check IPNS resolution and ensure latest CID is being fetched           | [track.md](./docs/track.md) |

### Debug Resources

- **UCAN Validation**: Use the built-in UCAN checker at `/check-ucan`
- **Progress Monitoring**: Track document status at `/status`
- **IPFS Gateway**: Try alternative gateways if content doesn't load
- **Console Logs**: Check browser console for detailed error messages

---

## Contributing

We welcome community contributions!

### 🔄 Fork & PR

1. Fork this repo
2. Create your feature branch (`git checkout -b feat/ucan-analytics`)
3. Commit changes
4. Push and open PR

### 📄 Coding Guidelines

* Use TypeScript and descriptive naming
* Keep UCAN logic in `lib/storacha.ts` or related helper files
* UI components follow Tailwind + `@/components/ui` conventions
* Update relevant documentation in `/docs` for new features

### 📚 Documentation Standards

When adding new features:
- Update the relevant documentation file in `/docs`
- Add references to the main README
- Include code examples and flow diagrams
- Test all documented workflows

---

## License

This project is open source and available under the [MIT License](./LICENSE).

