import { NextRequest, NextResponse } from "next/server";
import { getUserIdentifier, SelfBackendVerifier } from "@selfxyz/core";
import { storeVerificationData } from "./db";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    console.log("Self verification request:", body);

    const { proof, publicSignals } = body;

    if (!proof || !publicSignals) {
      return NextResponse.json({
        success: false,
        error: "Proof and publicSignals are required",
        status: 400,
      });
    }

    // Extract user ID from the proof
    const userId = await getUserIdentifier(publicSignals);
    console.log("Extracted userId:", userId);
    const url = `${process.env.NEXT_PUBLIC_URL}/api/self`;

    // Initialize and configure the verifier
    const selfBackendVerifier = new SelfBackendVerifier(
      "Deep Name Minting",
      url,
      "hex",
      true
    );

    // Verify the proof
    const result = await selfBackendVerifier.verify(proof, publicSignals);
    console.log("Verification result:", result);

    if (result.isValid) {
      // Store Self verification data locally
      const name = Array.isArray(result.credentialSubject?.name)
        ? result.credentialSubject.name.join(" ")
        : "";
      const merkleRoot = result.credentialSubject?.merkle_root || "0";

      const verificationData = {
        label: name,
        self_root: merkleRoot,
        userId: userId,
      };

      console.log("Storing Self verification data:", verificationData);
      try {
        storeVerificationData(verificationData);
        console.log("Successfully stored verification data");
      } catch (error) {
        console.error("Error storing verification data:", error);
        throw error;
      }

      // Return success response
      return NextResponse.json({
        status: "success",
        result: true,
        credentialSubject: result.credentialSubject,
      });
    } else {
      console.log("Verification failed");
      return NextResponse.json({
        status: "error",
        result: false,
        error: "Verification failed",
      });
    }
  } catch (error) {
    console.error("Error in Self verification:", error);
    return NextResponse.json({
      status: "error",
      result: false,
      error: error instanceof Error ? error.message : "Internal server error",
    });
  }
}
