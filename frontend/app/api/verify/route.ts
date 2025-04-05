import { NextRequest, NextResponse } from "next/server";
import {
  verifyCloudProof,
  IVerifyResponse,
  ISuccessResult,
} from "@worldcoin/minikit-js";

interface IRequestPayload {
  payload: ISuccessResult;
  action: string;
  signal: string | undefined;
}

export async function POST(req: NextRequest) {
  try {
    const { payload, action, signal } = (await req.json()) as IRequestPayload;
    const app_id = process.env.NEXTAUTH_WORLDCOIN_ID as `app_${string}`;

    if (!app_id) {
      return NextResponse.json(
        { error: "APP_ID is not configured" },
        { status: 500 }
      );
    }

    console.log("Verifying with:", { app_id, action, signal });
    const verifyRes = (await verifyCloudProof(
      payload,
      app_id,
      action,
      signal
    )) as IVerifyResponse;

    console.log("Verification result:", verifyRes);

    if (verifyRes.success) {
      console.log("World ID Proof Details:", {
        root: payload.merkle_root,
        groupId: payload.nullifier_hash,
        signalHash: signal,
        nullifierHash: payload.nullifier_hash,
        externalNullifierHash: action,
        proof: payload.proof,
      });

      return NextResponse.json({
        success: true,
        verifyRes,
        status: 200,
      });
    } else {
      return NextResponse.json({
        success: false,
        error: "Verification failed",
        status: 400,
      });
    }
  } catch (error) {
    console.error("Verification error:", error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : "Internal server error",
      status: 500,
    });
  }
}
