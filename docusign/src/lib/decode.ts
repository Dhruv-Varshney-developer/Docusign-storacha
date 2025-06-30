import * as Delegation from "@web3-storage/w3up-client/delegation";

interface DecodedDelegation {
  audience: string;
  issuer: string;
  capabilities: any[];
  expiration: Date;
  notBefore?: Date;
  isValid: boolean;
  status: "valid" | "expired" | "not-yet-valid";
}

export async function decodeDelegation(
  base64: string
): Promise<DecodedDelegation> {
  try {
    const archiveBytes = Buffer.from(base64, "base64");
    const proof = await Delegation.extract(archiveBytes);

    if (!proof.ok) {
      throw new Error("Invalid UCAN delegation format");
    }

    const audience = proof.ok.audience.did();
    const issuer = proof.ok.issuer.did();
    const capabilities = proof.ok.capabilities;
    const expiration = new Date(proof.ok.expiration * 1000);
    const notBefore = proof.ok?.notBefore
      ? new Date(proof.ok.notBefore * 1000)
      : undefined;

    // Check validity based on current time
    const now = new Date();
    let status: "valid" | "expired" | "not-yet-valid" = "valid";
    let isValid = true;

    if (notBefore && now < notBefore) {
      status = "not-yet-valid";
      isValid = false;
    } else if (now > expiration) {
      status = "expired";
      isValid = false;
    }

    // Log for debugging (you can remove these in production)
    console.log("Audience:", audience);
    console.log("Issuer:", issuer);
    console.log("Capabilities:", capabilities);
    console.log("Expiration:", expiration.getTime() / 1000);
    console.log(
      "Not Before:",
      notBefore ? notBefore.getTime() / 1000 : "undefined"
    );
    console.log("Status:", status);

    return {
      audience,
      issuer,
      capabilities,
      expiration,
      notBefore,
      isValid,
      status,
    };
  } catch (error) {
    console.error("Error decoding delegation:", error);
    throw new Error(
      `Failed to decode UCAN delegation: ${
        error instanceof Error ? error.message : "Unknown error"
      }`
    );
  }
}
