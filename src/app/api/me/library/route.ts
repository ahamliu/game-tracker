import { and, desc, eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/db";
import { getSessionWithUserRow } from "@/lib/auth-user";
import { games, libraryEntries, listMemberships, lists } from "@/db/schema";
import { createUserSubmittedGame, findOrCreateGameFromIgdb } from "@/lib/catalog";

const statusSchema = z.enum(["planning", "playing", "completed", "on_hold", "dropped"]);

const postSchema = z
  .object({
    igdbId: z.number().int().positive().optional(),
    gameId: z.string().uuid().optional(),
    title: z.string().min(1).max(500).optional(),
    coverUrl: z.string().url().optional().nullable(),
    status: statusSchema.default("planning"),
    rating: z.number().int().min(0).max(10).optional().nullable(),
    listIds: z.array(z.string().uuid()).optional(),
  })
  .superRefine((data, ctx) => {
    const keys = [data.igdbId != null, !!data.gameId, !!data.title].filter(Boolean);
    if (keys.length !== 1) {
      ctx.addIssue({
        code: "custom",
        message: "Provide exactly one of igdbId, gameId, or title",
      });
    }
  });

export async function GET(req: Request) {
  const r = await getSessionWithUserRow();
  if (!r.ok) {
    if (r.kind === "stale-session") {
      return NextResponse.json(
        {
          error: {
            code: "STALE_SESSION",
            message: "Session no longer matches the database. Sign in again.",
          },
        },
        { status: 401 }
      );
    }
    return NextResponse.json({ error: { code: "UNAUTHORIZED", message: "Sign in required" } }, { status: 401 });
  }
  const session = r.session;

  const { searchParams } = new URL(req.url);
  const listId = searchParams.get("listId");
  const limit = Math.min(100, Math.max(1, Number(searchParams.get("limit")) || 50));
  const offset = Math.max(0, Number(searchParams.get("offset")) || 0);

  if (listId) {
    const list = await db.query.lists.findFirst({
      where: eq(lists.id, listId),
    });
    if (!list || list.userId !== session.user.id) {
      return NextResponse.json({ error: { code: "NOT_FOUND", message: "List not found" } }, { status: 404 });
    }
    const memberships = await db.query.listMemberships.findMany({
      where: eq(listMemberships.listId, listId),
      with: {
        libraryEntry: {
          with: { game: true },
        },
      },
      orderBy: (lm, { desc: d }) => [d(lm.addedAt)],
      limit,
      offset,
    });
    const entries = memberships.map((m) => m.libraryEntry);
    return NextResponse.json({ entries });
  }

  const entries = await db.query.libraryEntries.findMany({
    where: eq(libraryEntries.userId, session.user.id),
    with: { game: true },
    orderBy: [desc(libraryEntries.updatedAt)],
    limit,
    offset,
  });

  return NextResponse.json({ entries });
}

export async function POST(req: Request) {
  try {
    const r = await getSessionWithUserRow();
    if (!r.ok) {
      if (r.kind === "stale-session") {
        return NextResponse.json(
          {
            error: {
              code: "STALE_SESSION",
              message: "Session no longer matches the database. Sign in again.",
            },
          },
          { status: 401 }
        );
      }
      return NextResponse.json({ error: { code: "UNAUTHORIZED", message: "Sign in required" } }, { status: 401 });
    }

    const json = await req.json().catch(() => null);
    const parsed = postSchema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json(
        { error: { code: "VALIDATION", message: parsed.error.flatten() } },
        { status: 400 }
      );
    }

    const { igdbId, gameId, title, coverUrl, status, rating, listIds } = parsed.data;
    const userId = r.userId;

    let resolvedGameId: string | null = null;

    if (gameId) {
      const g = await db.query.games.findFirst({ where: eq(games.id, gameId) });
      if (!g) {
        return NextResponse.json({ error: { code: "NOT_FOUND", message: "Game not found" } }, { status: 404 });
      }
      resolvedGameId = g.id;
    } else if (igdbId != null) {
      const g = await findOrCreateGameFromIgdb(igdbId);
      if (!g) {
        return NextResponse.json(
          { error: { code: "NOT_FOUND", message: "Could not load game from IGDB" } },
          { status: 404 }
        );
      }
      resolvedGameId = g.id;
    } else if (title) {
      const g = await createUserSubmittedGame({
        title,
        coverUrl: coverUrl ?? null,
        userId,
      });
      if (!g) {
        return NextResponse.json(
          { error: { code: "SERVER", message: "Could not create game" } },
          { status: 500 }
        );
      }
      resolvedGameId = g.id;
    }

    if (!resolvedGameId) {
      return NextResponse.json({ error: { code: "VALIDATION", message: "No game resolved" } }, { status: 400 });
    }

    const existing = await db.query.libraryEntries.findFirst({
      where: and(eq(libraryEntries.userId, userId), eq(libraryEntries.gameId, resolvedGameId)),
    });

    if (existing) {
      return NextResponse.json(
        { error: { code: "CONFLICT", message: "This game is already in your library", entryId: existing.id } },
        { status: 409 }
      );
    }

    const [entry] = await db
      .insert(libraryEntries)
      .values({
        userId,
        gameId: resolvedGameId,
        status,
        rating: rating ?? null,
      })
      .returning();

    if (!entry) {
      return NextResponse.json({ error: { code: "SERVER", message: "Insert failed" } }, { status: 500 });
    }

    if (listIds?.length) {
      for (const lid of listIds) {
        const list = await db.query.lists.findFirst({ where: eq(lists.id, lid) });
        if (!list || list.userId !== userId) continue;
        const already = await db.query.listMemberships.findFirst({
          where: and(eq(listMemberships.listId, lid), eq(listMemberships.libraryEntryId, entry.id)),
        });
        if (!already) {
          await db.insert(listMemberships).values({ listId: lid, libraryEntryId: entry.id });
        }
      }
    }

    const full = await db.query.libraryEntries.findFirst({
      where: eq(libraryEntries.id, entry.id),
      with: { game: true },
    });

    return NextResponse.json({ entry: full });
  } catch (err) {
    console.error("POST /api/me/library", err);
    const message = err instanceof Error ? err.message : "Unexpected error";
    return NextResponse.json({ error: { code: "SERVER", message } }, { status: 500 });
  }
}
