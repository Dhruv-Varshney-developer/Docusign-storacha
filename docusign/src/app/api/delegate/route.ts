import { NextRequest, NextResponse } from "next/server";
import { createUCANDelegation } from "@/lib/storacha";
import { Signer } from "@/types/types";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { cid, name, signers, fileName } = body;

    const result = await Promise.all(
      signers.map(async (item: Signer) => {

        const delegationResult = await createUCANDelegation({
          recipientDID: item.did,
          signerName: item.name, // Pass signer name
          baseCapabilities: item.capabilities,
          deadline: Number(item.deadline),
          notBefore: item.notBefore ? Number(item.notBefore) : undefined,
          fileCID: cid,
          IPNSKeyName: name,
          fileName: fileName
        });

        const delegationBase64ToSendToFrontend =
          Buffer.from(delegationResult).toString("base64");

        console.log("capabilities for", item.did, item.capabilities);
        
        return {
          receipientDid: item.did,
          signerName: item.name, // Include signer name in response
          delegationBase64ToSendToFrontend,
        };
      })
    );

    return NextResponse.json(
      {
        success: true,
        message: "Data received successfully",
        data: {
          name,
          signers,
          delegationResult: result,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    return NextResponse.json(
      { success: false, error: "Invalid JSON or malformed request" },
      { status: 400 }
    );
  }
}
