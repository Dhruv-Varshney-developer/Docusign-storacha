import jsPDF from "jspdf";
import { Signer } from "@/types/types";
import { LocalSigner } from "./signerUtils";
import { ensureIPNSKeyFromScratch, publishToIPNS } from "@/lib/ipns";

export const handleSubmit = async (
  e: React.FormEvent,
  signers: LocalSigner[],
  numSigners: number,
  result: any,
  setDelegated: (v: boolean) => void,
  setFrontendInfo: (info: {
    ipnsName: string;
    secretKey: string;
    delegations: any[];
  }) => void
) => {
  e.preventDefault();

  const parsed = signers.map((s, idx) => ({
    ...s,
    index: idx + 1,
    start: new Date(s.startTime ?? ""),
    end: new Date(s.deadline),
  }));

  const errors: string[] = [];
  for (const s of parsed) {
    if (
      isNaN(s.start.getTime()) ||
      isNaN(s.end.getTime()) ||
      s.start >= s.end
    ) {
      errors.push(`Signer ${s.index} has invalid time range.`);
    }
  }

  parsed.sort((a, b) => a.start.getTime() - b.start.getTime());
  for (let i = 0; i < parsed.length - 1; i++) {
    const cur = parsed[i], next = parsed[i + 1];
    if (next.start.getTime() < cur.end.getTime() + 60000) {
      errors.push(
        `Signer ${cur.index} and ${next.index} have overlapping times.`
      );
    }
  }

  if (errors.length) {
    alert("Validation failed:\n" + errors.join("\n"));
    return;
  }

  const formatted = parsed.map((s) => ({
    did: s.did,
    capabilities: s.capabilities,
    deadline: Math.floor(s.end.getTime() / 1000).toString(),
    notBefore: Math.floor(s.start.getTime() / 1000).toString(),
  }));

  try {

    const ipnsKeyName = `ipns-${result.cid}`;
    const ipnsNameObject = await ensureIPNSKeyFromScratch(ipnsKeyName);
    const ipnsNameString = ipnsNameObject.toString();
    const res = await fetch("/api/delegate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ cid: result.cid, name: ipnsNameString, fileName: result.filename, numSigners, signers: formatted }),
    });

    const { data } = await res.json();
    const saved = data.delegationResult.map((d: any) => ({
      recipientDid: d.receipientDid,
      delegation: d.delegationBase64ToSendToFrontend,
      fileName: result.filename,
    }));

    // ✅ Save to localStorage
    localStorage.setItem(`delegations:${result.cid}`, JSON.stringify(saved));

    const doc = new jsPDF();
    doc.text(doc.splitTextToSize(JSON.stringify(saved, null, 2), 180), 10, 10);
    const delegationBlob = doc.output("blob");

    const agreementPdfBlob = await fetch(result.url).then((r) => r.blob());
    const agreementFile = new File([agreementPdfBlob], result.filename, {
      type: result.type,
    });

    // ✅ Ensure IPNS key and name (persistent)
    const ipnsNameObj = ipnsNameObject;

    const ipnsName = ipnsNameObj.toString();
    if (!ipnsNameObj?.key?.bytes) {
      console.error("❌ key.bytes is undefined in ipnsNameObj");
      throw new Error("Invalid IPNS key: key.bytes is undefined.");
    }

    const secretKeyHex = Array.from(ipnsNameObj.key.bytes)
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");



    const formDataIPNS = new FormData();
    formDataIPNS.append("ipnsName", ipnsName);
    formDataIPNS.append("agreement", agreementFile);
    formDataIPNS.append(
      "delegation",
      new File([delegationBlob], "delegations.pdf", {
        type: "application/pdf",
      })
    );

    const uploadRes = await fetch("/api/delegationUpload", {
      method: "POST",
      body: formDataIPNS,
    });

    const uploadJson = await uploadRes.json();
    if (!uploadJson.success) throw new Error(uploadJson.error);


    await publishToIPNS(ipnsNameObj, uploadJson.cid);


    setDelegated(true);

    const storedRaw = JSON.parse(localStorage.getItem(ipnsKeyName) || '{}');

    // ✅ Pass info to frontend UI
    setFrontendInfo({
      ipnsName,
      secretKey: storedRaw,
      delegations: saved,
    });

    console.log("✅ Uploaded:", uploadJson.cid);
    console.log("🧪 IPNS:", ipnsName);
    console.log("🔐 Secret Key:", secretKeyHex);
  } catch (err) {
    console.error("Delegation error:", err);
    alert("Delegation failed. See console for details.");
  }
};
