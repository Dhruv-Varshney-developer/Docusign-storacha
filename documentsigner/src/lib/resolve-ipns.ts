export async function getLatestCID(ipnsName: string): Promise<string> {
    const res = await fetch(`https://name.web3.storage/name/${ipnsName}`);
    if (!res.ok) throw new Error("Failed to resolve IPNS name");

    const data = await res.json();
    const cid = data.value.replace("/ipfs/", "");
    return cid;
}
