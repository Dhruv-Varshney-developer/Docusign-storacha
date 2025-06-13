import { NextRequest, NextResponse } from "next/server";
import { createUCANDelegation, initStorachaClient, uploadFileToStoracha } from "@/lib/storacha";
import { validateFile } from "@/utils/fileHelpers";
import { Signer } from "@/types/types";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
try {
    const body = await req.json();
    
    const { cid, numSigners, signers } = body;
    
    console.log("CID:", cid);
    console.log("Number of Signers:", numSigners);
    console.log("Signers:", signers);

    const result=await Promise.all(signers.map(async (item:Signer)=>{
        const delegationResult=await createUCANDelegation({
            recipientDID:item.did,
            baseCapabilities:item.capabilities,
            deadline:Number(item.deadline)
        })
        return delegationResult;
    }))

    console.log("The result is",result)
    
    return NextResponse.json(
          { success: true, message: "Data received successfully", data: { cid, numSigners, signers } },
          { status: 200 }
    );
    } catch (error) {
        return NextResponse.json(
          { success: false, error: "Invalid JSON or malformed request" },
          { status: 400 }
        );
    }
}
