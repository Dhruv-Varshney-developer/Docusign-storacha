import * as Name from 'w3name'

export async function ensureIPNSKeyFromScratch(): Promise<Name.WritableName> {
  const name = await Name.create();
  console.log("Created IPNS name:", name.toString());

  return name;
}

export async function publishToIPNS(name: Name.WritableName, cid: string) {
  const value = `/ipfs/${cid}`;
  const revision = await Name.v0(name, value);
  await Name.publish(revision, name.key);

  console.log(`Published ${value} to IPNS: ${name.toString()}`);
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
