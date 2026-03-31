import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { searchCatalog } from "@/lib/catalog";

export async function GET(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: { code: "UNAUTHORIZED", message: "Sign in required" } }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q") ?? "";
  const limit = Math.min(30, Math.max(1, Number(searchParams.get("limit")) || 20));

  const results = await searchCatalog(q, limit);
  return NextResponse.json({ results });
}
