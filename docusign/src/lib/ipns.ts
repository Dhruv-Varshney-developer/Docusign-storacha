import * as Name from 'w3name'

export async function ensureIPNSKeyFromScratch(): Promise<Name.WritableName> {
  const name = await Name.create();

  return name;
}

export async function publishToIPNS(name: Name.WritableName, cid: string) {
  const value = `/ipfs/${cid}`;
  const revision = await Name.v0(name, value);
  await Name.publish(revision, name.key);

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
  return name;
}
