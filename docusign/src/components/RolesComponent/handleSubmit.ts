import jsPDF from "jspdf";
import { Signer } from "@/types/types";
import { LocalSigner } from "./signerUtils";

export const handleSubmit = async (
  e: React.FormEvent,
  signers: LocalSigner[],
  numSigners: number,
  result: any,
  setDelegated: (v: boolean) => void
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
    const cur = parsed[i],
      next = parsed[i + 1];
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

  const formatted: Signer[] = parsed.map((s) => ({
    did: s.did,
    capabilities: s.capabilities,
    deadline: Math.floor(s.end.getTime() / 1000).toString(),
    notBefore: Math.floor(s.start.getTime() / 1000).toString(),
  }));

  try {
    const res = await fetch("/api/Delegate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ cid: result.cid, numSigners, signers: formatted }),
    });

    const { data } = await res.json();
    const saved = data.delegationResult.map((d: any) => ({
      recipientDid: d.receipientDid,
      delegation: d.delegationBase64ToSendToFrontend,
    }));

    localStorage.setItem(`delegations:${result.cid}`, JSON.stringify(saved));

    const doc = new jsPDF();
    doc.text(doc.splitTextToSize(JSON.stringify(saved, null, 2), 180), 10, 10);
    const blob = doc.output("blob");
    const file = new File([blob], `delegations-${result.cid}.pdf`, {
      type: "application/pdf",
    });

    const formData = new FormData();
    formData.append("file", file);
    await fetch("/api/upload", { method: "POST", body: formData });

    setDelegated(true);
  } catch (err) {
    console.error("Delegation error:", err);
  }
};
