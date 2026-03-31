import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/db";
import { games } from "@/db/schema";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_req: Request, ctx: Ctx) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: { code: "UNAUTHORIZED", message: "Sign in required" } }, { status: 401 });
  }

  const { id } = await ctx.params;
  const game = await db.query.games.findFirst({ where: eq(games.id, id) });
  if (!game) {
    return NextResponse.json({ error: { code: "NOT_FOUND", message: "Game not found" } }, { status: 404 });
  }
  return NextResponse.json({ game });
}
