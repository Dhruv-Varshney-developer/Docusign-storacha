import React from "react";
import { baseCapabilities } from "@/utils/fileHelpers";
import {
  LocalSigner,
  updateSignerField,
  toggleCapability,
} from "./signerUtils";

type Props = {
  index: number;
  signer: LocalSigner;
  signers: LocalSigner[];
  setSigners: React.Dispatch<React.SetStateAction<LocalSigner[]>>;
};

export const SignerForm = ({ index, signer, signers, setSigners }: Props) => (
  <div className="p-4 border rounded-lg space-y-4 bg-gray-50 dark:bg-gray-800">
    <h3 className="font-semibold text-gray-700 dark:text-white">
      Signer {index + 1}
    </h3>

    <div>
      <label className="block mb-1 text-sm">Signer Name</label>
      <input
        type="text"
        value={signer.name || ''}
        onChange={(e) =>
          updateSignerField(index, "name", e.target.value, signers, setSigners)
        }
        className="w-full px-4 py-2 border rounded"
        placeholder="Enter signer's name"
        required
      />
    </div>

    <div>
      <label className="block mb-1 text-sm">Signer DID</label>
      <input
        type="text"
        value={signer.did}
        onChange={(e) =>
          updateSignerField(index, "did", e.target.value, signers, setSigners)
        }
        className="w-full px-4 py-2 border rounded"
        required
      />
    </div>

    <div>
      <label className="block mb-1 text-sm">Capabilities</label>
      <div className="flex flex-wrap gap-2">
        {baseCapabilities.map((cap) => (
          <label
            key={cap}
            className={`px-3 py-1 border rounded-full cursor-pointer ${
              signer.capabilities.includes(cap)
                ? "bg-indigo-600 text-white"
                : "bg-white text-gray-800"
            }`}
          >
            <input
              type="checkbox"
              className="hidden"
              checked={signer.capabilities.includes(cap)}
              onChange={() => toggleCapability(index, cap, signers, setSigners)}
            />
            {cap}
          </label>
        ))}
      </div>
    </div>

    <div>
      <label className="block mb-1 text-sm">Start Time</label>
      <input
        type="datetime-local"
        value={signer.startTime}
        onChange={(e) =>
          updateSignerField(
            index,
            "startTime",
            e.target.value,
            signers,
            setSigners
          )
        }
        className="w-full px-4 py-2 border rounded"
        required
      />
    </div>

    <div>
      <label className="block mb-1 text-sm">Deadline</label>
      <input
        type="datetime-local"
        value={signer.deadline}
        onChange={(e) =>
          updateSignerField(
            index,
            "deadline",
            e.target.value,
            signers,
            setSigners
          )
        }
        className="w-full px-4 py-2 border rounded"
        required
      />
    </div>
  </div>
);
