"use server";

import * as Client from "@web3-storage/w3up-client";
import { StoreMemory } from "@web3-storage/w3up-client/stores/memory";
import * as Proof from "@web3-storage/w3up-client/proof";
import { Capabilities, Signer } from "@web3-storage/w3up-client/principal/ed25519";
import * as Delegation from '@ucanto/core/delegation'
import * as DID from '@ipld/dag-ucan/did'

export async function initStorachaClient() {
  const principal = Signer.parse(process.env.STORACHA_KEY!);
  const store = new StoreMemory();
  const client = await Client.create({ principal, store });

  const proof = await Proof.parse(process.env.STORACHA_PROOF!);
  const space = await client.addSpace(proof);
  await client.setCurrentSpace(space.did());
  return client;
}

export async function uploadFileToStoracha(client: Client.Client, file: File) {
  try {
    const cid = await client.uploadFile(file);
    return {
      cid: cid.toString(),
      filename: file.name,
      size: file.size,
      type: file.type,
      url: `https://w3s.link/ipfs/${cid}`,
      uploadedAt: new Date().toISOString(),
    };
  } catch (error: any) {
    console.error("Error uploading file to Storacha:", error);
    throw new Error("Failed to upload file: " + error.message);
  }
}

export const createUCANDelegation = async ({
  recipientDID,
  deadline,
  baseCapabilities
}:{
  recipientDID : string,
  deadline : number,
  baseCapabilities: string[]
}) => {
  try {
    const client = await initStorachaClient();
    const expiration =deadline;
    const spaceDID = client.agent.did();
    const audience = DID.parse(recipientDID);
    const agent = client.agent;
    const capabilities = baseCapabilities.map(cap => ({
      with: `${spaceDID}`,
      can: cap,
      nb: {
        expiration
      },
    })) as Capabilities;

    const ucan = await Delegation.delegate({
      issuer: agent.issuer,
      audience,
      capabilities
    })
    const cid = await ucan.cid;
    console.log("The cid of delegation is", cid);
    const archive = await ucan.archive();

    if (!archive.ok) {
      throw new Error('Failed to create delegation archive');
    }
    console.log('Delegation archive created successfully', archive.ok);
    return archive.ok
  } catch (err) {
    console.error('Error creating UCAN delegation:', err);
    throw err;
  }
};

