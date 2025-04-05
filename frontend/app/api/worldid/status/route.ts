import { NextResponse } from "next/server";
import { getWorldIdVerificationData } from "../db";

export async function GET() {
  const data = getWorldIdVerificationData();

  if (!data) {
    return NextResponse.json({
      success: false,
      error: "No World ID verification data available",
    });
  }

  return NextResponse.json({
    success: true,
    data: {
      root: data.root,
      nullifierHash: data.nullifierHash,
      proof: data.proof,
    },
  });
}
