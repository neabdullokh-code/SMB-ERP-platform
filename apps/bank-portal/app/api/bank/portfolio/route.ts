import { NextResponse } from "next/server";
import { getBankPortfolio } from "@sqb/api-client";

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
  const result = await getBankPortfolio(sessionToken, {
    q: searchParams.get("q") ?? undefined,
    region: searchParams.get("region") ?? undefined,
    inventoryRisk: (searchParams.get("inventoryRisk") as "low" | "moderate" | "high" | null) ?? undefined,
    trend: (searchParams.get("trend") as "up" | "flat" | "down" | null) ?? undefined,
    sort: (searchParams.get("sort") as "score_desc" | "score_asc" | "tenant" | null) ?? undefined
  });

  return NextResponse.json(result.body, { status: result.status });
}
