import { NextRequest, NextResponse } from "next/server";
import {
  getUserIdentifier,
  SelfBackendVerifier,
  countryCodes,
} from "@selfxyz/core";

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
    const url = "https://cd2f-111-235-226-130.ngrok-free.app/api/self";

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
      // Return successful verification response
      return NextResponse.json({
        status: "success",
        result: result.isValid,
        credentialSubject: result.credentialSubject,
      });
    } else {
      // Return failed verification response
      return NextResponse.json(
        {
          status: "error",
          result: false,
          message: "Verification failed",
          details: result.isValidDetails,
        },
        { status: 500 }
      );
    }
  } catch (error: any) {
    console.error("Self verification error:", error);
    return NextResponse.json({
      success: false,
      error: error.message || "Internal server error",
      status: 500,
    });
  }
}
