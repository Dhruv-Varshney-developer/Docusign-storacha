# 📄 PDF Upload Flow — Doc-Sign Frontend + API Integration

This guide walks you through the PDF upload flow we use in the **Doc-Sign** project. It's a simple and reusable setup using Next.js (App Router), a drag-n-drop UI component, and Storacha for decentralized file storage.

---

## 📦 What are we building?

A PDF uploader component that:
- lets users drag and drop or browse for a `.pdf` file,
- uploads it to a secure backend route,
- stores it on [Storacha](https://storacha.xyz),
- and gives back the file’s CID and metadata.

---

## 🧩 Flow Overview

1. User selects a file (drag/drop or browse).
2. File is validated and temporarily shown in the UI.
3. On clicking **Upload**, it’s sent to `/api/upload`.
4. The API handles validation and uploads the file to **Storacha**.
5. The response includes a `cid`, which you can store or use to render links.

---

## 🧱 1. Upload UI — [`FileUploader.tsx`](./../src/components/FileUploader.tsx)

```tsx
"use client";
import { useState, useRef, useCallback } from "react";
import { Upload, File, X, Loader2 } from "lucide-react";
// full component omitted for brevity
```

The UI lets users drop or select files. Here's what it handles:

- `handleDragOver`, `handleDrop`, `handleFileSelect`: capture the file input.
- `handleRemoveFile`: lets the user reset the file input.
- `handleSubmit`: submits the file to your upload API.
- Upload button disables when there's no file or upload is in progress.

Drag-and-drop state and a loading spinner keep the experience smooth.

### What gets returned?

Once uploaded, it updates the state with the uploaded CID and notifies the parent using `onUploadSuccess`.

---

## 🚀 2. Upload API Route — [`/api/upload/route.ts`](./../src/app/api/upload/route.ts)

```ts
import { initStorachaClient, uploadFileToStoracha } from "@/lib/storacha";

export async function POST(req: NextRequest) {
  const formData = await req.formData();
  const file = formData.get("file") as File;

  if (!file) {
    return NextResponse.json(
      { success: false, error: "No file uploaded" },
      { status: 400 }
    );
  }

  const validation = validateFile(file);
  if (!validation.isValid) {
    return NextResponse.json(
      { success: false, error: validation.error },
      { status: 400 }
    );
  }

  try {
    const client = await initStorachaClient();
    const result = await uploadFileToStoracha(client, file);
    return NextResponse.json({ success: true, data: result }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
```

Here’s what this route does:

- Accepts the file from the `FormData` request.
- Runs a basic validation (`validateFile`) to ensure it’s a PDF.
- Initializes the Storacha client.
- Uploads the file and returns the resulting CID and metadata.

### Example success response:

```json
{
  "success": true,
  "data": {
    "cid": "bafybeigdyr4k...",
    "filename": "document.pdf",
    "url": "https://w3s.link/ipfs/bafy.../document.pdf"
  }
}
```

---

## 🔐 3. Storacha Setup — [`lib/storacha.ts`](./../src/lib/storacha.ts)

This is where the actual file upload to Storacha happens.

```ts
const principal = Signer.parse(process.env.STORACHA_KEY!);
const proof = await Proof.parse(process.env.STORACHA_PROOF!);
```

### What’s going on?

- Uses `@web3-storage/w3up-client` to talk to Storacha.
- You provide a signer key and a proof (delegation token) to authenticate.
- Then you use `uploadDirectory()` to upload the file.
- Returns the CID and generates a public IPFS link via `w3s.link`.

---

## ✅ File Validation — [`utils/fileHelpers.ts`](./../src/utils/fileHelpers.ts)

You’ll want to validate file type and size before upload. For example:

```ts
export function validateFile(file: File) {
  if (file.type !== "application/pdf") return { isValid: false, error: "Only PDF files allowed." };
  if (file.size > 10 * 1024 * 1024) return { isValid: false, error: "Max file size is 10MB." };
  return { isValid: true };
}
```

---

## 🔧 Environment Setup

Make sure to add these environment variables:

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

You can get them from your [Storacha dashboard](https://storacha.xyz) after generating your key + delegation proof.

---

## 🪄 That’s it

You now have a working, user-friendly, decentralized PDF uploader. Drop this component in any form or signing workflow and connect the CID to your contract or DB logic.
