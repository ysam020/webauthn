import base64url from "base64url";
import crypto from "crypto";
import UserModel from "./model/userModel.mjs";

// Function to generate a random challenge
function generateChallenge() {
  const randomBytes = crypto.randomBytes(32);
  return base64url.encode(randomBytes);
}
///////////////////////////////////////////////////////////////////////////////
export async function generateAttestationOptions(username) {
  try {
    let user = await UserModel.findOne({ username });
    if (!user) {
      // If user doesn't exist, create a new user
      user = await UserModel.create({ username });
    }

    // Generate attestation options based on user data
    const challenge = generateChallenge();

    const attestationOptions = {
      challenge,
      rpId: "localhost",
      rp: { name: "WebAuthn" },
      user: {
        id: base64url.encode(Buffer.from(user.username)),
        name: user.username,
        displayName: user.username,
      },
      pubKeyCredParams: [{ type: "public-key", alg: -7 }],
      timeout: 60000,
      attestation: "direct",
    };

    return attestationOptions;
  } catch (error) {
    throw new Error(`Error generating attestation options: ${error.message}`);
  }
}

///////////////////////////////////////////////////////////////////////////////`
export async function verifyAttestationResponse(username, credential) {
  try {
    const user = await UserModel.findOne({ username });
    if (!user) {
      throw new Error(`User ${username} not found`);
    }

    // Convert clientDataJSON and attestationObject from arrays of bytes to buffers
    const clientDataJSONBuffer = Buffer.from(
      credential.response.clientDataJSON
    );
    const attestationObjectBuffer = Buffer.from(
      credential.response.attestationObject
    );

    // Decode clientDataJSON and attestationObject buffers to base64url strings
    const clientDataJSONString = base64url.encode(clientDataJSONBuffer);
    const attestationObjectString = base64url.encode(attestationObjectBuffer);

    if (!clientDataJSONString || !attestationObjectString) {
      throw new Error("Invalid attestation response data");
    }

    // Update credential information in user's record
    const newCredential = {
      credentialID: credential.id,
      publicKey: "dummyPublicKey",
      counter: 0,
    };

    // Push the new credential to user's webAuthnCredentials array
    user.webAuthnCredentials.push(newCredential);
    await user.save();

    return { verified: true, message: "Registration successful" };
  } catch (error) {
    console.error("Error verifying attestation response:", error);
    throw new Error(`Error verifying attestation response: ${error.message}`);
  }
}

///////////////////////////////////////////////////////////////////////////////
export async function generateAssertionOptions(username) {
  try {
    const user = await UserModel.findOne({ username });

    if (!user) {
      // If user doesn't exist, return a response indicating the user was not found
      return {
        error: true,
        message: `User ${username} not found`,
      };
    }

    // Generate a new challenge for assertion
    const challenge = generateChallenge();

    // Prepare options for WebAuthn assertion
    const assertionOptions = {
      challenge,
      rpId: "localhost",
      allowCredentials: user.webAuthnCredentials.map((cred) => ({
        type: "public-key",
        id: base64url.toBuffer(cred.credentialID),
        transports: cred.transports,
      })),
      timeout: 60000,
    };

    return assertionOptions;
  } catch (error) {
    throw new Error(`Error generating assertion options: ${error.message}`);
  }
}

///////////////////////////////////////////////////////////////////////////////`
export async function verifyAssertionResponse(username, credential) {
  try {
    const user = await UserModel.findOne({ username });
    if (!user) {
      throw new Error(`User ${username} not found`);
    }

    // Parse and decode the credential
    const {
      id,
      rawId,
      response: { authenticatorData, clientDataJSON, signature, userHandle },
    } = credential;

    // Update the credential counter in user's record
    const matchedCredential = user.webAuthnCredentials.find(
      (cred) => cred.credentialID === id
    );

    if (matchedCredential) {
      matchedCredential.counter++;
      await user.save();
    }

    return { success: true, message: "Assertion response verified" };
  } catch (error) {
    throw new Error(`Error verifying assertion response: ${error.message}`);
  }
}
