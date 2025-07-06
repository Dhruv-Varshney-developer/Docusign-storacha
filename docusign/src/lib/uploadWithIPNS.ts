import { initStorachaClient } from "./storacha";
import { ensureIPNSKeyFromScratch, publishToIPNS } from "./ipns";

let savedName: any = null;

export async function uploadWithDelegationAndUpdateIPNS({
  ipnsName,
  agreementPdf,
  delegationPdf,
}: {
  ipnsName: string;
  agreementPdf: File;
  delegationPdf: File;
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

  const cid = await client.uploadDirectory(files);

  if (!savedName) {
    savedName = await ensureIPNSKeyFromScratch();
  }

  const ipns = await publishToIPNS(savedName, cid.toString());

  return { newCid: cid.toString() };
}
