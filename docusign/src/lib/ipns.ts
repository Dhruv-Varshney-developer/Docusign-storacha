import * as Name from 'w3name'

export async function ensureIPNSKeyFromScratch(): Promise<Name.WritableName> {
  try {
    const raw = localStorage.getItem("ipnsKey");

    if (raw) {
      const parsed = JSON.parse(raw);

      if (Array.isArray(parsed.key)) {
        const keyBytes = Uint8Array.from(parsed.key); // ✅ restore raw bytes
        const name = await Name.from(keyBytes);       // ✅ CORRECT usage
        return name;
      }

      console.warn("Malformed IPNS key. Generating new.");
    }
  } catch (err) {
    console.error("Failed to load IPNS key:", err);
  }

  // Fallback: create new
  const name = await Name.create();
  localStorage.setItem(
    "ipnsKey",
    JSON.stringify({
      name: name.toString(),
      key: Array.from(name.key.bytes),
    })
  );
  return name;
}

export async function publishToIPNS(name: Name.WritableName, cid: string) {
  const value = `/ipfs/${cid}`;
  const revision = await Name.v0(name, value);

  if (!name?.key?.sign || typeof name.key.sign !== "function") {
    throw new Error("Signing key is invalid or undefined.");
  }

  await Name.publish(revision, name.key);
  console.log(`✅ Published to IPNS: ${name.toString()}`);
  return name.toString();
}



export async function loadOrCreateIPNSKey(): Promise<Name.WritableName> {
  const stored = localStorage.getItem("ipns-key");
  if (stored) {
    const bytes = Uint8Array.from(JSON.parse(stored));
    return await Name.from(bytes);
  }

  const name = await Name.create();
  localStorage.setItem("ipns-key", JSON.stringify(Array.from(name.key.bytes)));
  console.log("Created and saved new IPNS key:", name.toString());
  return name;
}
