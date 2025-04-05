import {
  MiniKit,
  VerifyCommandInput,
  VerificationLevel,
  ISuccessResult,
} from "@worldcoin/minikit-js";

const verifyPayload: VerifyCommandInput = {
  action: "proof-of-humanity", // This is your action ID from the Developer Portal
  verification_level: VerificationLevel.Orb, // Orb | Device
};

export const handleVerify = async () => {
  if (!MiniKit.isInstalled()) {
    return;
  }
  const { finalPayload } = await MiniKit.commandsAsync.verify(verifyPayload);
  if (finalPayload.status === "error") {
    return console.log("Error payload", finalPayload);
  }

  const verifyResponse = await fetch("/api/verify", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      payload: finalPayload as ISuccessResult, // Parses only the fields we need to verify
      action: "proof-of-humanity",
    }),
  });

  // TODO: Handle Success!
  const verifyResponseJson = await verifyResponse.json();
  if (verifyResponseJson.status === 200) {
    console.log("Verification success!");
  }
};
