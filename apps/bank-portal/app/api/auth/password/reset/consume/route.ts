import { NextResponse } from "next/server";
import { consumePasswordReset } from "@sqb/api-client";

export async function POST(request: Request) {
  const payload = await request.json();
  const result = await consumePasswordReset({ token: payload.token, newPassword: payload.newPassword });
  return NextResponse.json(result.body, { status: result.status });
}
