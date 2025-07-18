"use server";

import * as Client from "@web3-storage/w3up-client";
import { StoreMemory } from "@web3-storage/w3up-client/stores/memory";
import * as Proof from "@web3-storage/w3up-client/proof";
import * as Delegation from "@ucanto/core/delegation";
import * as DID from "@ipld/dag-ucan/did";
import {
  Signer,
  Capabilities,
} from "@web3-storage/w3up-client/principal/ed25519";
import { Link } from "@ucanto/core/schema";

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
    const files = [new File([file], file.name, { type: file.type })];

    const cid = await client.uploadDirectory(files);

    return {
      cid: cid.toString(),
      filename: file.name,
      size: file.size,
      type: file.type,
      url: `https://w3s.link/ipfs/${cid}/${file.name}`, // direct access of file
      uploadedAt: new Date().toISOString(),
    };
  } catch (error: any) {
    console.error("Error uploading file to Storacha:", error);
    throw new Error("Failed to upload file: " + error.message);
  }
}


type DelegationInput = {
  recipientDID: string;
  deadline: number; // expiration timestamp (seconds)
  notBefore?: number; // "not valid before" timestamp (seconds)
  baseCapabilities: string[];
  fileCID: string;
  IPNSKeyName: string,
  fileName: string
};

export const createUCANDelegation = async ({
  recipientDID,
  signerName, // Add signer name parameter
  deadline,
  notBefore,
  baseCapabilities,
  fileCID,
  IPNSKeyName,
  fileName
}: DelegationInput): Promise<Uint8Array> => {
  try {
    const client = await initStorachaClient();
    const spaceDID = client.agent.did();
    const audience = DID.parse(recipientDID);
    const agent = client.agent;

    const capabilities: Capabilities = baseCapabilities.map((can, i) => ({
      with: `${spaceDID}`,
      can,
      nb: {
        root: Link.parse(fileCID),
        cid: fileCID,
        filename: fileName,
        ipnsKeyName: IPNSKeyName,
        meta: {
          issuedBy: spaceDID.toString(),
          signerName: signerName,
          created: new Date().toISOString(),
        }
      }
    })) as Capabilities;

    const ucan = await Delegation.delegate({
      issuer: agent.issuer,
      audience,
      expiration: deadline,
      notBefore,
      capabilities,
    });

    const archive = await ucan.archive();
    if (!archive.ok) {
      throw new Error("Failed to create delegation archive");
    }

    return archive.ok;
  } catch (err) {
    console.error("Error creating UCAN delegation:", err);
    throw err;
  }
};
