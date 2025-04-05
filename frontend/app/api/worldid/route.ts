import { NextRequest, NextResponse } from "next/server";
import { storeWorldIdVerificationData } from "./db";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    console.log("World ID verification request:", body);

    const { root, nullifierHash, proof } = body;

    if (!root || !nullifierHash || !proof) {
      return NextResponse.json({
        success: false,
        error: "root, nullifierHash, and proof are required",
        status: 400,
      });
    }

    // Store World ID verification data
    const verificationData = {
      root,
      nullifierHash,
      proof: Array.isArray(proof) ? proof : [proof],
    };

    console.log("Storing World ID verification data:", verificationData);
    storeWorldIdVerificationData(verificationData);

    // Return success response
    return NextResponse.json({
      status: "success",
      result: true,
    });
  } catch (error) {
    console.error("Error in World ID verification:", error);
    return NextResponse.json({
      status: "error",
      result: false,
      error: error instanceof Error ? error.message : "Internal server error",
    });
  }
}
