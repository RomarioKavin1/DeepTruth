import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { verifySiweMessage } from "@worldcoin/minikit-js";

interface IRequestPayload {
  payload: {
    status: "success";
    message: string;
    signature: string;
    address: string;
    version: number;
  };
  nonce: string;
}

export async function POST(req: NextRequest) {
  const { payload, nonce } = (await req.json()) as IRequestPayload;

  if (nonce !== cookies().get("siwe")?.value) {
    return NextResponse.json({
      status: "error",
      isValid: false,
      message: "Invalid nonce",
    });
  }

  try {
    const validMessage = await verifySiweMessage(payload, nonce);
    return NextResponse.json({
      status: "success",
      isValid: validMessage.isValid,
    });
  } catch (error: any) {
    // Handle errors in validation or processing
    return NextResponse.json({
      status: "error",
      isValid: false,
      message: error.message,
    });
  }
}
