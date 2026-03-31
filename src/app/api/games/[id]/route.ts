import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { z } from "zod";
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

const patchSchema = z.object({
  coverUrl: z.union([z.string().url(), z.null()]).optional(),
  title: z.string().min(1).max(500).optional(),
});

export async function PATCH(req: Request, ctx: Ctx) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json(
      { error: { code: "UNAUTHORIZED", message: "Sign in required" } },
      { status: 401 }
    );
  }

  const { id } = await ctx.params;
  const game = await db.query.games.findFirst({ where: eq(games.id, id) });
  if (!game) {
    return NextResponse.json(
      { error: { code: "NOT_FOUND", message: "Game not found" } },
      { status: 404 }
    );
  }

  const json = await req.json().catch(() => null);
  const parsed = patchSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { error: { code: "VALIDATION", message: parsed.error.message } },
      { status: 400 }
    );
  }

  const updates: Record<string, unknown> = {};
  if (parsed.data.coverUrl !== undefined) {
    updates.coverUrl = parsed.data.coverUrl;
  }
  if (parsed.data.title !== undefined) {
    updates.title = parsed.data.title;
  }

  if (Object.keys(updates).length > 0) {
    await db.update(games).set(updates).where(eq(games.id, id));
  }

  const updated = await db.query.games.findFirst({ where: eq(games.id, id) });
  return NextResponse.json({ game: updated });
}
