export type LocalSigner = {
  did: string;
  name: string;
  capabilities: string[];
  startTime: string;
  deadline: string;
};

const pad = (n: number) => n.toString().padStart(2, "0");
const toLocalDatetime = (d: Date) =>
  `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(
    d.getHours()
  )}:${pad(d.getMinutes())}`;

export const updateSignerField = (
  index: number,
  field: keyof LocalSigner,
  value: string,
  signers: LocalSigner[],
  setSigners: React.Dispatch<React.SetStateAction<LocalSigner[]>>
) => {
  const updated = [...signers];
  updated[index][field] = value;

  if (field === "deadline" && index + 1 < updated.length) {
    const deadline = new Date(value);
    if (!isNaN(deadline.getTime())) {
      const next = new Date(deadline.getTime() + 60 * 1000);
      updated[index + 1].startTime = toLocalDatetime(next);
    }
  }

  setSigners(updated);
};

export const toggleCapability = (
  index: number,
  cap: string,
  signers: LocalSigner[],
  setSigners: React.Dispatch<React.SetStateAction<LocalSigner[]>>
) => {
  const updated = [...signers];
  const existing = updated[index].capabilities;
  updated[index].capabilities = existing.includes(cap)
    ? existing.filter((c) => c !== cap)
    : [...existing, cap];
  setSigners(updated);
};
