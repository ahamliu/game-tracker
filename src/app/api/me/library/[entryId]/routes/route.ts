import { and, count, eq, max } from "drizzle-orm";
import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { db } from "@/db";
import { characterRoutes, libraryEntries } from "@/db/schema";

const statusSchema = z.enum(["planning", "playing", "completed", "on_hold", "dropped"]);

const postSchema = z.object({
  name: z.string().min(1).max(200),
  status: statusSchema.default("planning"),
  rating: z.number().int().min(0).max(10).nullable().optional(),
  notes: z.string().max(20000).nullable().optional(),
});

const ROUTE_CAP = 50;

type Ctx = { params: Promise<{ entryId: string }> };

export async function POST(req: Request, ctx: Ctx) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: { code: "UNAUTHORIZED", message: "Sign in required" } }, { status: 401 });
  }

  const { entryId } = await ctx.params;
  const entry = await db.query.libraryEntries.findFirst({
    where: and(eq(libraryEntries.id, entryId), eq(libraryEntries.userId, session.user.id)),
  });
  if (!entry) {
    return NextResponse.json({ error: { code: "NOT_FOUND", message: "Entry not found" } }, { status: 404 });
  }

  const json = await req.json().catch(() => null);
  const parsed = postSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { error: { code: "VALIDATION", message: parsed.error.flatten() } },
      { status: 400 }
    );
  }

  const [{ c }] = await db
    .select({ c: count() })
    .from(characterRoutes)
    .where(eq(characterRoutes.libraryEntryId, entryId));

  if (c >= ROUTE_CAP) {
    return NextResponse.json(
      { error: { code: "LIMIT", message: `Maximum ${ROUTE_CAP} routes per game` } },
      { status: 400 }
    );
  }

  const [{ mx }] = await db
    .select({ mx: max(characterRoutes.sortOrder) })
    .from(characterRoutes)
    .where(eq(characterRoutes.libraryEntryId, entryId));
  const nextOrder = (mx ?? -1) + 1;

  const [route] = await db
    .insert(characterRoutes)
    .values({
      libraryEntryId: entryId,
      name: parsed.data.name.trim(),
      status: parsed.data.status,
      rating: parsed.data.rating ?? null,
      notes: parsed.data.notes ?? null,
      sortOrder: nextOrder,
    })
    .returning();

  return NextResponse.json({ route, warning: c >= ROUTE_CAP - 2 ? "near_cap" : undefined });
}
