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
  params: unknown;
}

export async function POST(req: NextRequest) {
  const { payload, action, signal, params } =
    (await req.json()) as IRequestPayload;
  const app_id = process.env.NEXTAUTH_WORLDCOIN_ID as `app_${string}`;
  console.log("Signal", signal);
  console.log({
    app_id,
    payload,
    action,
    signal,
    params,
  });
  const verifyRes = (await verifyCloudProof(
    payload,
    app_id,
    action,
    signal
  )) as IVerifyResponse; // Wrapper on this
  console.log("Verify res");
  console.log(verifyRes);
  if (verifyRes.success) {
    return NextResponse.json({
      success: {
        app_id,
        payload,
        action,
        signal,
      },
      status: 200,
    });
  } else {
    return NextResponse.json({ success: false, status: 400 });
  }
}
