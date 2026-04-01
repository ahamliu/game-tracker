import { and, eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { db } from "@/db";
import { libraryEntries } from "@/db/schema";
import { logActivity } from "@/lib/activity";

const statusSchema = z.enum(["planning", "playing", "completed", "on_hold", "dropped"]);

const patchSchema = z.object({
  status: statusSchema.optional(),
  rating: z.number().int().min(0).max(10).nullable().optional(),
  notes: z.string().max(5000).nullable().optional(),
  progressPercent: z.number().int().min(0).max(100).nullable().optional(),
  progressNote: z.string().max(500).nullable().optional(),
});

type Ctx = { params: Promise<{ entryId: string }> };

async function getOwnedEntry(entryId: string, userId: string) {
  return db.query.libraryEntries.findFirst({
    where: and(eq(libraryEntries.id, entryId), eq(libraryEntries.userId, userId)),
    with: { game: true },
  });
}

export async function GET(_req: Request, ctx: Ctx) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: { code: "UNAUTHORIZED", message: "Sign in required" } }, { status: 401 });
  }

  const { entryId } = await ctx.params;
  const entry = await db.query.libraryEntries.findFirst({
    where: and(eq(libraryEntries.id, entryId), eq(libraryEntries.userId, session.user.id)),
    with: {
      game: true,
      routes: {
        orderBy: (routes, { asc }) => [asc(routes.sortOrder), asc(routes.createdAt)],
      },
      listMemberships: { with: { list: true } },
    },
  });

  if (!entry) {
    return NextResponse.json({ error: { code: "NOT_FOUND", message: "Entry not found" } }, { status: 404 });
  }

  return NextResponse.json({ entry });
}

export async function PATCH(req: Request, ctx: Ctx) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: { code: "UNAUTHORIZED", message: "Sign in required" } }, { status: 401 });
  }

  const { entryId } = await ctx.params;
  const old = await getOwnedEntry(entryId, session.user.id);
  if (!old) {
    return NextResponse.json({ error: { code: "NOT_FOUND", message: "Entry not found" } }, { status: 404 });
  }

  const json = await req.json().catch(() => null);
  const parsed = patchSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { error: { code: "VALIDATION", message: parsed.error.flatten() } },
      { status: 400 }
    );
  }

  const p = parsed.data;
  const updates: Partial<typeof libraryEntries.$inferInsert> = { updatedAt: new Date() };
  if (p.status !== undefined) updates.status = p.status;
  if (p.rating !== undefined) updates.rating = p.rating;
  if (p.notes !== undefined) updates.notes = p.notes;
  if (p.progressPercent !== undefined) updates.progressPercent = p.progressPercent;
  if (p.progressNote !== undefined) updates.progressNote = p.progressNote;

  await db.update(libraryEntries).set(updates).where(eq(libraryEntries.id, entryId));

  const gameTitle = old.game?.title ?? "Game";

  if (p.status !== undefined && p.status !== old.status) {
    if (p.status === "completed") {
      await logActivity(
        session.user.id,
        "completed",
        { gameTitle, gameId: old.gameId },
        entryId
      );
    } else if (p.status === "playing" && old.status !== "playing") {
      await logActivity(session.user.id, "started", { gameTitle, gameId: old.gameId }, entryId);
    } else if (p.status === "dropped") {
      await logActivity(session.user.id, "dropped", { gameTitle, gameId: old.gameId }, entryId);
    } else if (p.status === "on_hold") {
      await logActivity(session.user.id, "on_hold", { gameTitle, gameId: old.gameId }, entryId);
    }
  }

  if (p.rating !== undefined && p.rating !== old.rating) {
    await logActivity(
      session.user.id,
      "rated",
      { gameTitle, rating: p.rating, gameId: old.gameId },
      entryId
    );
  }

  const entry = await db.query.libraryEntries.findFirst({
    where: eq(libraryEntries.id, entryId),
    with: {
      game: true,
      routes: {
        orderBy: (routes, { asc }) => [asc(routes.sortOrder), asc(routes.createdAt)],
      },
      listMemberships: { with: { list: true } },
    },
  });

  return NextResponse.json({ entry });
}

export async function DELETE(_req: Request, ctx: Ctx) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: { code: "UNAUTHORIZED", message: "Sign in required" } }, { status: 401 });
  }

  const { entryId } = await ctx.params;
  const old = await getOwnedEntry(entryId, session.user.id);
  if (!old) {
    return NextResponse.json({ error: { code: "NOT_FOUND", message: "Entry not found" } }, { status: 404 });
  }

  await db.delete(libraryEntries).where(eq(libraryEntries.id, entryId));
  return NextResponse.json({ ok: true });
}
