import React, { useState } from "react";
import { DelegationSuccessMessage } from "./DelegationSuccessComp";
import { SignerForm } from "./SignerForm";
import { handleSubmit } from "./handleSubmit";
import { LocalSigner } from "./signerUtils";

export const RoleBasedAccessComponent = ({ result }: { result: any }) => {
  const [numSigners, setNumSigners] = useState(1);
  const [signers, setSigners] = useState<LocalSigner[]>([
    { did: "", capabilities: [], deadline: "", startTime: "" },
  ]);
  const [delegated, setDelegated] = useState(false);

  const handleSignerCountChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const count = parseInt(e.target.value);
    setNumSigners(count);
    const updated = Array.from(
      { length: count },
      (_, i) =>
        signers[i] || { did: "", capabilities: [], deadline: "", startTime: "" }
    );
    setSigners(updated);
  };

  const onSubmit = (e: React.FormEvent) =>
    handleSubmit(e, signers, numSigners, result, setDelegated);

  if (delegated) {
    return <DelegationSuccessMessage cid={result.cid} />;
  }

  return (
    <div
      className={`${
        numSigners > 1 ? "max-w-4xl" : "max-w-2xl"
      } mx-auto mt-10 p-6 bg-white dark:bg-gray-900 shadow-lg rounded-2xl border`}
    >
      <h2 className="text-md font-semibold text-gray-800 dark:text-white mb-6">
        You are acting as: <span className="text-indigo-600">Uploader</span>
      </h2>
      <h2 className="text-md font-semibold text-gray-800 dark:text-white mb-6">
        For CID:{" "}
        <span className="text-indigo-600">
          {result.cid.slice(0, 10)}...{result.cid.slice(-35)}
        </span>
      </h2>

      <form onSubmit={onSubmit} className="space-y-6">
        <div>
          <label className="block text-sm mb-1">Number of Signers</label>
          <select
            className="w-full px-4 py-2 border rounded"
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
          <SignerForm
            key={idx}
            index={idx}
            signer={signer}
            signers={signers}
            setSigners={setSigners}
          />
        ))}

        <button
          type="submit"
          className="w-full py-2 px-4 bg-indigo-600 text-white rounded-lg"
        >
          Generate Delegation
        </button>
      </form>
    </div>
  );
};
