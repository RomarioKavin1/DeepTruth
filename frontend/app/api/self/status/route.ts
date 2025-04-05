import { NextResponse } from "next/server";
import { getVerificationData } from "../db";

export async function GET() {
  console.log("Status endpoint called");
  try {
    const verificationData = getVerificationData();
    console.log("Retrieved verification data:", verificationData);

    if (!verificationData) {
      console.log("No verification data available");
      return NextResponse.json({
        success: false,
        error: "No verification data available",
      });
    }

    console.log("Returning verification data");
    return NextResponse.json({
      success: true,
      data: {
        label: verificationData.label,
        self_root: verificationData.self_root,
      },
    });
  } catch (error) {
    console.error("Error in status endpoint:", error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : "Internal server error",
    });
  }
}
