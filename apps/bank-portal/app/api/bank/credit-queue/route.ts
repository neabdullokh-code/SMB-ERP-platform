import { NextResponse } from "next/server";
import { getCreditQueue } from "@sqb/api-client";

function readCookie(request: Request, name: string) {
  return request.headers.get("cookie")
    ?.split(";")
    .map((part) => part.trim())
    .find((part) => part.startsWith(`${name}=`))
    ?.slice(name.length + 1);
}

export async function GET(request: Request) {
  const sessionToken = readCookie(request, "erp_auth_session");
  if (!sessionToken) {
    return NextResponse.json({ message: "Session not found", errorCode: "SESSION_INVALID" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const result = await getCreditQueue(sessionToken, {
    status: (searchParams.get("status") as "submitted" | "in_review" | "approved" | "counter_offered" | "declined" | null) ?? undefined,
    recommendation: (searchParams.get("recommendation") as "approve" | "review" | "decline" | null) ?? undefined,
    priority: (searchParams.get("priority") as "high" | "normal" | null) ?? undefined,
    q: searchParams.get("q") ?? undefined,
    sort: (searchParams.get("sort") as "submitted_desc" | "score_desc" | "tenant" | null) ?? undefined
  });

  return NextResponse.json(result.body, { status: result.status });
}
