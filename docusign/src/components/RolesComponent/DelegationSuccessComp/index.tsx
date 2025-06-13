import React from "react";

interface Props {
  cid: string;
}

export const DelegationSuccessMessage = ({ cid }:Props) => {
  return (
    <div className="max-w-xl mx-auto mt-10 p-6 bg-green-50 dark:bg-green-900 text-green-800 dark:text-green-100 border border-green-300 dark:border-green-700 rounded-2xl shadow-lg">
      <h2 className="text-lg font-semibold mb-4"> Delegation Successful!</h2>
      <p className="mb-2">
        You’ve successfully delegated access for file:
      </p>
      <p className="break-words text-indigo-700 dark:text-indigo-300 font-mono text-sm">
        {cid}
      </p>
    </div>
  );
};
