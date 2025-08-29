import { NextRequest, NextResponse } from "next/server";
import { uploadWithDelegation } from "@/lib/uploadWithIPNS";
import { validateFile } from "@/utils/fileHelpers";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
    try {
        const form = await req.formData();
        const ipnsName = form.get("ipnsName") as string;
        const agreement = form.get("agreement") as File;
        const delegation = form.get("delegation") as File;

        if (!ipnsName || !agreement || !delegation) {
            return NextResponse.json(
                { success: false, error: "Missing inputs" },
                { status: 400 }
            );
        }

        // file validation
        for (const f of [agreement, delegation]) {
            const validation = validateFile(f);
            if (!validation.isValid) {
                return NextResponse.json(
                    { success: false, error: validation.error },
                    { status: 400 }
                );
            }
        }

        const { newCid } = await uploadWithDelegation({
            agreementPdf: agreement,
            delegationPdf: delegation,
        });


        return NextResponse.json({ success: true, cid: newCid });
    } catch (err: any) {
        console.error("Failed to upload dir + update IPNS:", err);
        return NextResponse.json({ success: false, error: err.message }, { status: 500 });
    }
}
