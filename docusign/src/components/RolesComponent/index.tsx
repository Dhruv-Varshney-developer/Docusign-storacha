/* eslint-disable @typescript-eslint/no-unused-vars */
import React, { useState } from "react";
import { Signer } from "@/types/types";
import { baseCapabilities } from "@/utils/fileHelpers";
import * as Delegation from "@ucanto/core/delegation";
import { DelegationSuccessMessage } from "./DelegationSuccessComp";
import jsPDF from "jspdf";

type LocalSigner = {
  did: string;
  capabilities: string[];
  deadline: string; // datetime-local
  startTime?: string; // datetime-local (optional, for override)
};

export const RoleBasedAccessComponent = ({ result }: { result: any }) => {
  const [numSigners, setNumSigners] = useState(1);
  const [signers, setSigners] = useState<LocalSigner[]>([
    { did: "", capabilities: [], deadline: "", startTime: "" },
  ]);
  const [delegated, setDelegated] = useState<boolean>(false);

  const handleSignerCountChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const count = parseInt(e.target.value);
    setNumSigners(count);

    const updatedSigners = Array.from(
      { length: count },
      (_, i) =>
        signers[i] || { did: "", capabilities: [], deadline: "", startTime: "" }
    );

    setSigners(updatedSigners);
  };

  const pad = (n: number) => n.toString().padStart(2, "0");
  const toLocalDatetime = (d: Date) =>
    `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(
      d.getHours()
    )}:${pad(d.getMinutes())}`;

  const updateSignerField = (
    index: number,
    field: "did" | "capabilities" | "deadline" | "startTime",
    value: string | string[]
  ) => {
    const updated = [...signers];

    if (field === "capabilities" && Array.isArray(value)) {
      updated[index].capabilities = value;
    } else if (field !== "capabilities" && typeof value === "string") {
      updated[index][field] = value;

      // Always auto-update next signer's startTime when current deadline changes
      if (field === "deadline") {
        const deadline = new Date(value);
        if (!isNaN(deadline.getTime()) && index + 1 < updated.length) {
          const nextStartTime = new Date(deadline.getTime() + 1 * 60 * 1000); // +1 min
          const local = toLocalDatetime(nextStartTime);
          updated[index + 1].startTime = local; // ✅ always update
        }
      }
    }

    setSigners(updated);
  };

  const toggleCapability = (index: number, capability: string) => {
    const updated = [...signers];
    const current = updated[index].capabilities;
    if (current.includes(capability)) {
      updated[index].capabilities = current.filter((c) => c !== capability);
    } else {
      updated[index].capabilities = [...current, capability];
    }
    setSigners(updated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Convert to datetime and sort signers by start time
    const parsedSigners = signers.map((signer, idx) => ({
      ...signer,
      index: idx + 1,
      start: new Date(signer.startTime ?? ""),
      end: new Date(signer.deadline),
    }));

    const errors: string[] = [];

    // Validate individual signer time logic
    for (const signer of parsedSigners) {
      if (
        !signer.start ||
        !signer.end ||
        isNaN(signer.start.getTime()) ||
        isNaN(signer.end.getTime())
      ) {
        errors.push(`Signer ${signer.index}: Invalid start or end time.`);
        continue;
      }
      if (signer.start >= signer.end) {
        errors.push(
          `Signer ${signer.index}: Start time must be before deadline.`
        );
      }
    }

    // Sort by start time for chaining logic
    parsedSigners.sort((a, b) => a.start.getTime() - b.start.getTime());

    // Chain enforcement & overlap detection
    for (let i = 0; i < parsedSigners.length - 1; i++) {
      const current = parsedSigners[i];
      const next = parsedSigners[i + 1];

      const minNextStart = new Date(current.end.getTime() + 60 * 1000); // +1 minute
      if (next.start.getTime() < minNextStart.getTime()) {
        errors.push(
          `Signer ${current.index} and Signer ${next.index} have overlapping timeframes or gap < 1 min.`
        );
      }
    }

    if (errors.length > 0) {
      alert("Delegation validation failed:\n\n" + errors.join("\n"));
      return;
    }

    try {
      const formattedSigners: Signer[] = parsedSigners.map((signer) => ({
        did: signer.did,
        capabilities: signer.capabilities,
        deadline: Math.floor(signer.end.getTime() / 1000).toString(),
        notBefore: signer.start
          ? Math.floor(signer.start.getTime() / 1000).toString()
          : undefined,
      }));

      const payload = {
        cid: result.cid,
        numSigners,
        signers: formattedSigners,
      };

      const res = await fetch("/api/Delegate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const response = await res.json();
      const { delegationResult } = response.data;

      const savedDelegations = delegationResult.map(
        ({
          receipientDid,
          delegationBase64ToSendToFrontend,
        }: {
          receipientDid: string;
          delegationBase64ToSendToFrontend: string;
        }) => {
          return {
            recipientDid: receipientDid,
            delegation: delegationBase64ToSendToFrontend,
          };
        }
      );

      localStorage.setItem(
        `delegations:${result.cid}`,
        JSON.stringify(savedDelegations)
      );

      setDelegated(true);

      const doc = new jsPDF();
      const readableText = JSON.stringify(savedDelegations, null, 2);
      const lines = doc.splitTextToSize(readableText, 180);
      doc.text(lines, 10, 10);
      const pdfBlob = doc.output("blob");
      const delegationFileObject = new File(
        [pdfBlob],
        `delegations-${result.cid}.pdf`,
        {
          type: "application/pdf",
        }
      );
      const formData = new FormData();
      formData.append("file", delegationFileObject);
      await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });
    } catch (err) {
      console.error("Failed to send data to backend:", err);
    }
  };

  if (delegated) {
    return <DelegationSuccessMessage cid={result.cid} />;
  }

  return (
    <div
      className={`${
        numSigners > 1 ? "max-w-4xl" : "max-w-2xl"
      } mx-auto mt-10 p-6 bg-white dark:bg-gray-900 shadow-lg rounded-2xl border border-gray-200 dark:border-gray-700`}
    >
      <h2 className="text-md font-semibold text-gray-800 dark:text-white mb-6">
        You are acting as: <span className="text-indigo-600">Uploader </span>
      </h2>
      <h2 className="text-md font-semibold text-gray-800 dark:text-white mb-6">
        For the file with CID :{" "}
        <span className="text-indigo-600">
          {result.cid.slice(0, 10)}...{result.cid.slice(-35)}
        </span>
      </h2>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="relative">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Number of Signers
          </label>
          <select
            className="w-full px-4 py-2 border rounded-lg bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white"
            value={numSigners}
            onChange={handleSignerCountChange}
          >
            {[1, 2, 3, 4, 5].map((num) => (
              <option key={num} value={num}>
                {num}
              </option>
            ))}
          </select>
        </div>

        {signers.map((signer, idx) => (
          <div
            key={idx}
            className="p-4 border rounded-lg space-y-4 bg-gray-50 dark:bg-gray-800"
          >
            <h3 className="text-md font-semibold text-gray-700 dark:text-white">
              Signer {idx + 1}
            </h3>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Signer&rsquo;s DID
              </label>
              <input
                type="text"
                value={signer.did}
                onChange={(e) => updateSignerField(idx, "did", e.target.value)}
                placeholder="did:key:z..."
                required
                className="w-full px-4 py-2 border rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Capabilities (select multiple)
              </label>
              <div className="flex flex-wrap gap-2">
                {baseCapabilities.map((cap) => (
                  <label
                    key={cap}
                    className={`cursor-pointer px-3 py-1 rounded-full border ${
                      signer.capabilities.includes(cap)
                        ? "bg-indigo-600 text-white border-indigo-600"
                        : "bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-300 border-gray-300"
                    }`}
                  >
                    <input
                      type="checkbox"
                      className="hidden"
                      checked={signer.capabilities.includes(cap)}
                      onChange={() => toggleCapability(idx, cap)}
                    />
                    {cap}
                  </label>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Access Start Time (Not Before)
              </label>
              <input
                type="datetime-local"
                value={signer.startTime}
                onChange={(e) =>
                  updateSignerField(idx, "startTime", e.target.value)
                }
                className="w-full px-4 py-2 border rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Access Deadline
              </label>
              <input
                type="datetime-local"
                value={signer.deadline}
                onChange={(e) =>
                  updateSignerField(idx, "deadline", e.target.value)
                }
                className="w-full px-4 py-2 border rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
                required
              />
            </div>
          </div>
        ))}

        <button
          type="submit"
          className="w-full py-2 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-lg shadow-md"
        >
          Generate Delegation
        </button>
      </form>
    </div>
  );
};
