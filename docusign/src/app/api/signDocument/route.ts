import { NextRequest, NextResponse } from "next/server";
import { uploadWithDelegation } from "@/lib/uploadWithIPNS";


export const runtime = "nodejs";

export async function POST(req: NextRequest) {
    try {
        const form = await req.formData();
        const ipnsName = form.get("ipnsName") as string;
        const newSignedFile = form.get("signed") as File;

        if (!ipnsName || !newSignedFile) {
            return NextResponse.json({ success: false, error: "Missing inputs" }, { status: 400 });
        }

        const fetchFile = async (filePath: string, fileName: string) => {
            const url = `https://w3s.link/ipns/${ipnsName}/${filePath}`;
            const proxyUrl = `${process.env.NEXT_PUBLIC_APP_ORIGIN || "http://localhost:3002"}/api/fetch-delegation?url=${encodeURIComponent(url)}`;
            const res = await fetch(proxyUrl);
            if (!res.ok) throw new Error(`Failed to fetch ${filePath}`);
            const blob = await res.blob();
            return new File([blob], fileName, { type: "application/pdf" });
        };


        const [agreementFile, delegationFile] = await Promise.all([
            fetchFile("agreement.pdf", "agreement.pdf"),
            fetchFile("delegations.pdf", "delegations.pdf"),
        ]);

        const { newCid } = await uploadWithDelegation({
            agreementPdf: agreementFile,
            delegationPdf: delegationFile,
            signedPdf: newSignedFile,
            // ipnsName, // ✅ pass this!
        });


        return NextResponse.json({ success: true, cid: newCid });
    } catch (err: any) {
        console.error("Signing + reupload failed:", err);
        return NextResponse.json({ success: false, error: err.message }, { status: 500 });
    }
}
