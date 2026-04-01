import { and, eq, inArray } from "drizzle-orm";
import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/db";
import { games, libraryEntries } from "@/db/schema";
import { searchCatalog } from "@/lib/catalog";

export async function GET(req: Request) {
  const session = await auth();
  const userId = session?.user?.id;

  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q") ?? "";
  const limit = Math.min(30, Math.max(1, Number(searchParams.get("limit")) || 20));

  const results = await searchCatalog(q, limit);

  if (!userId) {
    return NextResponse.json({ results: results.map((r) => ({ ...r, inLibrary: false })) });
  }

  const localIds = results.filter((r) => r.kind === "local").map((r) => r.id);
  const igdbIds = results.filter((r) => r.kind === "igdb" && r.igdbId != null).map((r) => r.igdbId!);

  const libraryGameIds = new Set<string>();

  if (localIds.length > 0) {
    const entries = await db
      .select({ gameId: libraryEntries.gameId })
      .from(libraryEntries)
      .where(and(eq(libraryEntries.userId, userId), inArray(libraryEntries.gameId, localIds)));
    for (const e of entries) libraryGameIds.add(e.gameId);
  }

  if (igdbIds.length > 0) {
    const importedGames = await db
      .select({ id: games.id, igdbId: games.igdbId })
      .from(games)
      .where(inArray(games.igdbId, igdbIds));

    const importedMap = new Map(importedGames.map((g) => [g.igdbId!, g.id]));
    const importedIds = [...importedMap.values()];

    if (importedIds.length > 0) {
      const entries = await db
        .select({ gameId: libraryEntries.gameId })
        .from(libraryEntries)
        .where(and(eq(libraryEntries.userId, userId), inArray(libraryEntries.gameId, importedIds)));
      for (const e of entries) libraryGameIds.add(e.gameId);
    }

    for (const r of results) {
      if (r.kind === "igdb" && r.igdbId != null) {
        const localId = importedMap.get(r.igdbId);
        if (localId && libraryGameIds.has(localId)) {
          (r as Record<string, unknown>).inLibrary = true;
        }
      }
    }
  }

  const enriched = results.map((r) => ({
    ...r,
    inLibrary: (r as Record<string, unknown>).inLibrary === true || (r.kind === "local" && libraryGameIds.has(r.id)),
  }));

  return NextResponse.json({ results: enriched });
}
