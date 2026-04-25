import { NextResponse } from "next/server";
import { confirmEmailChange } from "@sqb/api-client";

export async function POST(request: Request) {
  const payload = await request.json();
  const result = await confirmEmailChange(payload);
  return NextResponse.json(result.body, { status: result.status });
}
