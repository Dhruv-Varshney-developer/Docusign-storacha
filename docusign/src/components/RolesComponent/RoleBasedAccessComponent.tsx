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
  const [frontendInfo, setFrontendInfo] = useState<{
    ipnsName: string;
    secretKey: { name: string; key: number[] };
    delegations: any[];
  } | null>(null);



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
    handleSubmit(e, signers, numSigners, result, setDelegated, setFrontendInfo);

  if (delegated && frontendInfo) {
    return (
      <div className="max-w-3xl mx-auto mt-10 p-6 bg-white dark:bg-gray-900 shadow-lg rounded-2xl border">
        <DelegationSuccessMessage cid={result.cid} />

        <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
          <h3 className="text-sm font-semibold text-green-800 mb-2">
            ✅ Delegation Info
          </h3>

          <div className="text-sm text-green-700 space-y-2">
            <p>
              <strong>IPNS Name:</strong>{" "}
              <span className="break-all">{frontendInfo.ipnsName}</span>
            </p>

            <p>
              <strong>Secret Key:</strong>
              <textarea
                value={JSON.stringify(frontendInfo.secretKey, null, 2)}
                readOnly
                className="w-full p-2 bg-white border text-xs rounded mt-1 font-mono"
                rows={5}
              />

              <span className="text-yellow-600 text-xs">
                ⚠️ Save this key securely — you’ll need it to republish.
              </span>
            </p>

            <p>
              <strong>Delegations:</strong>
              <pre className="bg-white p-2 text-xs font-mono rounded overflow-x-auto">
                {JSON.stringify(frontendInfo.delegations, null, 2)}
              </pre>
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`${numSigners > 1 ? "max-w-4xl" : "max-w-2xl"
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
