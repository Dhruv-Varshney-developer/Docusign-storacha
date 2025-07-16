

# 🖋️ DocuSign on Storacha – UCAN-based Document Signing

**DocuSign on Storacha** is a full-stack demo application showcasing real-world UCAN (User Controlled Authorization Networks) capabilities using [Storacha](https://storacha.network/) for decentralized file storage and permission delegation.

This project enables secure, permissioned workflows for uploading, viewing, and signing PDF documents, using UCANs for cryptographically-verifiable, time-bound, and role-specific access control.

---

## 📖 Table of Contents

* [Overview](#overview)
* [Features](#features)
* [UCAN Concepts Demonstrated](#ucan-concepts-demonstrated)
* [Getting Started](#getting-started)
* [Extending the Project](#extending-the-project)
* [Troubleshooting](#troubleshooting)
* [Contributing](#contributing)
* [License](#license)

---

## Overview

This application demonstrates how UCANs can replace traditional access control systems by delegating authority directly between users via cryptographically signed tokens. The project uses **Storacha** to store documents on IPFS, and manages sequential signing flows between users like `uploader`, `signer1`, and `signer2`.

---

## Features

### PDF Upload

* Drag-and-drop interface
* File size/type validation
* Upload to Storacha-backed IPFS
* CID and metadata returned post-upload

###  UCAN-Backed Role-Based Access

* DID-based identity
* Role delegation: uploader, signer1, signer2
* Time-limited access via UCAN proofs
* Sequential access enforcement

###  Digital Signing

* Sign PDFs with a canvas-based signature pad
* Generate SHA-256 hash of PDF + signature
* Signed metadata stored as a new PDF

###  UCAN Proof Chain Viewer

* Decode Base64 UCAN delegations
* Verify validity, expiration, and issuer/audience
* Visual proof-chain explorer

---

## UCAN Concepts Demonstrated

| Concept                      | Description                                                                |
| ---------------------------- | -------------------------------------------------------------------------- |
| **Capability Delegation**    | UCANs define what a recipient *can* do (`can`) with what resource (`with`) |
| **Proof Chains**             | Each UCAN is verifiable via a chain of signed delegations                  |
| **Time-Bound Access**        | UCANs include `nbf` (not-before) and `exp` (expiration) timestamps         |
| **Revocation-by-expiry**     | Signing permission automatically invalidated after use or timeout          |
| **Sequential Authorization** | Signer1 → Signer2 enforced by chaining and timing of UCANs                 |
| **Verification**             | Validations for format, audience, and expiration built into viewer         |

---

## Getting Started

### 🧩 Prerequisites

* Node.js ≥ 18
* Yarn or npm
* Git

### Setup Instructions

### 1. Clone the repository

```bash
git clone https://github.com/Dhruv-Varshney-developer/Docusign-storacha
cd sharebox
```


### 2. Install dependencies

```bash
npm install
# or
yarn install
```

### 3. Set up Web3.Storage credentials

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

### 4. Create `.env` file

In the root of your project:

```env
STORACHA_KEY=<your_key_from_w3_key_create>
STORACHA_PROOF=<your_delegation_from_w3_delegation_create>
```

### 5. Start the application using:

```
npm run dev
```


## Configure Environment Keys

You'll need to securely store your private Storacha credentials in a file named `.env `.

Example:

```env
# .env
STORACHA_KEY="MgCaNVLZHF8........SO_ON"
STORACHA_PROOF="mAYIEAIMOEaJlcm9vd.....SO_ON"
```

---

### Folder Structure 

```
src/
├── app/
│   ├── upload/           # PDF upload logic (Storacha)
│   ├── check-ucan/       # UCAN proof chain verification
│   ├── view-pdf/         # View PDF from IPFS
├── components/           # FileUploader, PDFViewer, RolesComponent
├── lib/                  # UCAN + Storacha logic
├── utils/                # PDF + File validation helpers
```

---

##  Extending the Project

Here are ideas for adding more UCAN-centric functionality:

| Extension                  | Idea                                                           |
| -------------------------- | -------------------------------------------------------------- |
| 🔄 **UCAN Revocation**     | Enable issuer-side revocation with updated proofs              |
| 🔗 **Multi-party Signing** | Add arbitrators, witnesses, or 3+ signers                      |
| 🛂 **Auditing Logs**       | Persist and show signature history on-chain/IPFS               |
| 🎭 **Custom Capabilities** | Define fine-grained actions (`sign`, `read`, `annotate`, etc.) |
| 📜 **Encrypted PDFs**      | Encrypt documents; decrypt via UCAN-constrained capability     |

---

## Troubleshooting

| Problem                   | Solution                                                                 |
| ------------------------- | ------------------------------------------------------------------------ |
|  *Upload fails*          | Ensure file is `.pdf` and <10MB                                          |
|  *UCAN invalid/expired* | Check Base64 formatting, audience DID, or expiration time                |
|  *Signature not saving* | Verify you’re signing within your time slot and delegation is valid      |
| *CID not resolving*   | IPFS propagation may take a few seconds — retry or use different gateway |

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

---


## License

This project is open source and available under the [MIT License](./LICENSE).

