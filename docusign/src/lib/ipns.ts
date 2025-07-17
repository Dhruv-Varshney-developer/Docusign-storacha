import * as Name from 'w3name';

export async function ensureIPNSKeyFromScratch(storageKey: string): Promise<Name.WritableName> {
  try {

    if (!storageKey) {
      throw new Error("❌ IPNS storageKey is required!");
    }


    const raw = localStorage.getItem(storageKey);

    if (raw) {
      const parsed = JSON.parse(raw);

      if (Array.isArray(parsed.key)) {
        const keyBytes = Uint8Array.from(parsed.key);
        const name = await Name.from(keyBytes);
        return name;
      }

      console.warn("Malformed IPNS key. Regenerating new one.");
    }
  } catch (err) {
    console.error("Failed to load IPNS key from storage:", err);
  }

  // ❗Fallback: create new key and persist in raw form
  const name = await Name.create();
  const rawKeyObj = {
    name: name.toString(),
    key: Array.from(name.key.bytes),
  };

  localStorage.setItem(storageKey, JSON.stringify(rawKeyObj));
  return name;
}


export async function publishToIPNS(name: Name.WritableName, cid: string) {
  const value = `/ipfs/${cid}`;
  let revision;

  try {
    const current = await Name.resolve(name);
    revision = await Name.increment(current, value); // ✅ bump revision
  } catch {
    revision = await Name.v0(name, value); // ✅ first time publishing
  }

  await Name.publish(revision, name.key);


  if (!name?.key?.sign || typeof name.key.sign !== "function") {
    throw new Error("Signing key is invalid or undefined.");
  }

  return name.toString();
}

export function exportIPNSKey(name: Name.WritableName): { name: string; key: number[] } {
  return {
    name: name.toString(),
    key: Array.from(name.key.bytes)
  };
}



export async function importIPNSKeyFromJSON(json: string | { name: string, key: number[] }): Promise<Name.WritableName> {
  const data = typeof json === "string" ? JSON.parse(json) : json;

  if (!Array.isArray(data.key)) {
    throw new Error("IPNS key data is invalid: missing or malformed 'key' array.");
  }

  const keyBytes = Uint8Array.from(data.key);
  const name = await Name.from(keyBytes);

  // Optional: Validate reconstructed name matches data.name
  const expected = data.name;
  const actual = name.toString();
  if (expected !== actual) {
    console.warn(`⚠️ Imported name mismatch: expected ${expected}, got ${actual}`);
  }

  return name;
}
