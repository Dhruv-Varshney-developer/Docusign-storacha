import { NextRequest, NextResponse } from "next/server";
import { initStorachaClient, uploadFileToStoracha } from "@/lib/storacha";
import { validateFile } from "@/utils/fileHelpers";

export const runtime = "nodejs";

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
