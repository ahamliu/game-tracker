import { and, eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { db } from "@/db";
import { characterRoutes, libraryEntries } from "@/db/schema";

const statusSchema = z.enum(["planning", "playing", "completed", "on_hold", "dropped"]);

const patchSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  status: statusSchema.optional(),
  rating: z.number().int().min(0).max(10).nullable().optional(),
  notes: z.string().max(5000).nullable().optional(),
  sortOrder: z.number().int().min(0).optional(),
  imageUrl: z.union([z.string().url(), z.null()]).optional(),
});

type Ctx = { params: Promise<{ entryId: string; routeId: string }> };

async function assertRouteOwned(entryId: string, routeId: string, userId: string) {
  const entry = await db.query.libraryEntries.findFirst({
    where: and(eq(libraryEntries.id, entryId), eq(libraryEntries.userId, userId)),
  });
  if (!entry) return null;
  const route = await db.query.characterRoutes.findFirst({
    where: and(eq(characterRoutes.id, routeId), eq(characterRoutes.libraryEntryId, entryId)),
  });
  return route;
}

export async function PATCH(req: Request, ctx: Ctx) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: { code: "UNAUTHORIZED", message: "Sign in required" } }, { status: 401 });
  }

  const { entryId, routeId } = await ctx.params;
  const existing = await assertRouteOwned(entryId, routeId, session.user.id);
  if (!existing) {
    return NextResponse.json({ error: { code: "NOT_FOUND", message: "Route not found" } }, { status: 404 });
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
  const updates: Partial<typeof characterRoutes.$inferInsert> = {};
  if (p.name !== undefined) updates.name = p.name.trim();
  if (p.status !== undefined) updates.status = p.status;
  if (p.rating !== undefined) updates.rating = p.rating;
  if (p.notes !== undefined) updates.notes = p.notes;
  if (p.sortOrder !== undefined) updates.sortOrder = p.sortOrder;
  if (p.imageUrl !== undefined) updates.imageUrl = p.imageUrl;

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ route: existing });
  }

  const [route] = await db
    .update(characterRoutes)
    .set(updates)
    .where(eq(characterRoutes.id, routeId))
    .returning();

  return NextResponse.json({ route });
}

export async function DELETE(_req: Request, ctx: Ctx) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: { code: "UNAUTHORIZED", message: "Sign in required" } }, { status: 401 });
  }

  const { entryId, routeId } = await ctx.params;
  const existing = await assertRouteOwned(entryId, routeId, session.user.id);
  if (!existing) {
    return NextResponse.json({ error: { code: "NOT_FOUND", message: "Route not found" } }, { status: 404 });
  }

  await db.delete(characterRoutes).where(eq(characterRoutes.id, routeId));
  return NextResponse.json({ ok: true });
}
