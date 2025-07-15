import { NextRequest, NextResponse } from "next/server";
import { uploadWithDelegation } from "@/lib/uploadWithIPNS";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
    try {
        const form = await req.formData();
        const ipnsName = form.get("ipnsName") as string;
        const newSignedFile = form.get("signed") as File;
        const resolvedCid = form.get("resolvedCid") as string;

        if (!ipnsName || !newSignedFile || !resolvedCid) {
            return NextResponse.json({ success: false, error: "Missing inputs" }, { status: 400 });
        }

        const fetchFile = async (filePath: string, fileName: string) => {
            // Use resolved CID directly - no IPNS!
            const url = `https://w3s.link/ipfs/${resolvedCid}/${filePath}`;
            const proxyUrl = `${process.env.NEXT_PUBLIC_APP_ORIGIN || "http://localhost:3002"}/api/fetch-delegation?url=${encodeURIComponent(url)}`;
            
            console.log(`📁 Fetching ${fileName} from: ${url}`);
            
            const res = await fetch(proxyUrl);
            if (!res.ok) throw new Error(`Failed to fetch ${filePath} - Status: ${res.status}`);
            const blob = await res.blob();
            return new File([blob], fileName, { type: "application/pdf" });
        };

        try {
            // Step 1: Try to fetch both files from the resolved CID
            const [agreementFile, delegationFile] = await Promise.all([
                fetchFile("agreement.pdf", "agreement.pdf"),
                fetchFile("delegations.pdf", "delegations.pdf"),
            ]);

            console.log("✅ Successfully fetched both files");

            // Step 2: Upload all files including the new signed.pdf
            const { newCid } = await uploadWithDelegation({
                agreementPdf: agreementFile,
                delegationPdf: delegationFile,
                signedPdf: newSignedFile,
            });

            return NextResponse.json({ success: true, cid: newCid });

        } catch (fetchError) {
            console.error("❌ Failed to fetch existing files:", fetchError);
            
            // Step 3: If files don't exist, this means it's a new setup
            // Return error to handle this case in the frontend
            return NextResponse.json({ 
                success: false, 
                error: "Required files not found in IPFS. Please ensure agreement.pdf and delegations.pdf exist.",
                code: "FILES_NOT_FOUND"
            }, { status: 404 });
        }

    } catch (err: any) {
        console.error("Signing + reupload failed:", err);
        return NextResponse.json({ success: false, error: err.message }, { status: 500 });
    }
}
