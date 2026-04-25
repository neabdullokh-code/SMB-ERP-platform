import { NextResponse } from "next/server";
import { requestPasswordReset } from "@sqb/api-client";

export async function POST(request: Request) {
  const payload = await request.json();
  const result = await requestPasswordReset(payload.identifier);
  return NextResponse.json(result.body, { status: result.status });
}
