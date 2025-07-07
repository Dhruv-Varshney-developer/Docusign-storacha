import { initStorachaClient } from "./storacha";

export async function uploadWithDelegation({
  agreementPdf,
  delegationPdf,
  signedPdf,
}: {
  agreementPdf: File;
  delegationPdf: File;
  signedPdf?: File;
}): Promise<{ newCid: string }> {
  const client = await initStorachaClient();

  const files = [
    new File([await agreementPdf.arrayBuffer()], "agreement.pdf", {
      type: "application/pdf",
    }),
    new File([await delegationPdf.arrayBuffer()], "delegations.pdf", {
      type: "application/pdf",
    }),
  ];

  if (signedPdf) {
    files.push(new File([signedPdf], "signed.pdf", { type: "application/pdf" }));
  }

  const cid = await client.uploadDirectory(files);
  console.log("📁 Uploaded new dir:", cid.toString());

  return { newCid: cid.toString() };
}
