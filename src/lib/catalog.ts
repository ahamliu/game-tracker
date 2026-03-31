import { eq, ilike } from "drizzle-orm";
import { db } from "@/db";
import { games } from "@/db/schema";
import {
  coverUrlFromIgdb,
  developerFromIgdb,
  genresFromIgdb,
  getIgdbGame,
  searchIgdb,
} from "@/lib/igdb";
import { randomSuffix, slugify } from "@/lib/utils";

export async function findOrCreateGameFromIgdb(igdbId: number) {
  const existing = await db.query.games.findFirst({
    where: eq(games.igdbId, igdbId),
  });
  if (existing) return existing;

  const igdb = await getIgdbGame(igdbId);
  if (!igdb) return null;

  const platformNames =
    igdb.platforms?.map((p) => p?.name).filter(Boolean) as string[] | undefined;

  const slug = `${slugify(igdb.name)}-${igdbId}-${randomSuffix()}`;
  const releaseDate = igdb.first_release_date
    ? new Date(igdb.first_release_date * 1000)
    : null;

  const genres = genresFromIgdb(igdb.genres);
  const developerName = developerFromIgdb(igdb.involved_companies);

  try {
    const [row] = await db
      .insert(games)
      .values({
        source: "igdb",
        igdbId,
        title: igdb.name,
        slug,
        summary: igdb.summary ?? null,
        releaseDate,
        coverUrl: coverUrlFromIgdb(igdb.cover),
        platforms: platformNames?.length ? platformNames : null,
        genres,
        developerName: developerName ?? null,
        aggregatedRating: igdb.aggregated_rating != null ? Math.round(igdb.aggregated_rating) : null,
        aggregatedRatingCount: igdb.aggregated_rating_count ?? null,
        totalRating: igdb.total_rating != null ? Math.round(igdb.total_rating) : null,
        totalRatingCount: igdb.total_rating_count ?? null,
      })
      .returning();

    return row ?? null;
  } catch (e) {
    // Concurrent requests can race on the same igdb_id unique index (23505).
    const code =
      typeof e === "object" && e !== null && "code" in e
        ? String((e as { code: unknown }).code)
        : undefined;
    const causeCode =
      typeof e === "object" &&
      e !== null &&
      "cause" in e &&
      typeof (e as { cause: unknown }).cause === "object" &&
      (e as { cause: object | null }).cause !== null &&
      "code" in (e as { cause: { code?: unknown } }).cause
        ? String((e as { cause: { code: unknown } }).cause.code)
        : undefined;
    if (code === "23505" || causeCode === "23505") {
      return (
        (await db.query.games.findFirst({
          where: eq(games.igdbId, igdbId),
        })) ?? null
      );
    }
    throw e;
  }
}

export async function searchCatalog(query: string, limit = 20) {
  const q = query.trim();
  const igdbHits = await searchIgdb(q, limit);

  const local =
    q.length >= 2
      ? await db.query.games.findMany({
          where: ilike(games.title, `%${q.replace(/%/g, "\\%")}%`),
          limit: 10,
        })
      : [];

  const merged: {
    kind: "igdb" | "local";
    id: string;
    igdbId?: number;
    title: string;
    coverUrl?: string | null;
    summary?: string | null;
    developerName?: string | null;
  }[] = [];

  for (const g of local) {
    merged.push({
      kind: "local",
      id: g.id,
      title: g.title,
      coverUrl: g.coverUrl,
      summary: g.summary,
      developerName: g.developerName,
    });
  }

  for (const h of igdbHits) {
    merged.push({
      kind: "igdb",
      id: `igdb:${h.id}`,
      igdbId: h.id,
      title: h.name,
      coverUrl: coverUrlFromIgdb(h.cover),
      summary: h.summary,
      developerName: developerFromIgdb(h.involved_companies),
    });
  }

  return merged.slice(0, limit);
}

export async function createUserSubmittedGame(input: {
  title: string;
  coverUrl?: string | null;
  userId: string;
}) {
  const slug = `${slugify(input.title)}-${randomSuffix()}`;
  const [row] = await db
    .insert(games)
    .values({
      source: "user",
      title: input.title.trim(),
      slug,
      coverUrl: input.coverUrl ?? null,
      submittedBy: input.userId,
    })
    .returning();
  return row ?? null;
}

export async function findSimilarTitles(title: string) {
  const t = title.trim();
  if (t.length < 2) return [];
  const esc = t.replace(/%/g, "\\%").replace(/_/g, "\\_");
  return db.query.games.findMany({
    where: ilike(games.title, `%${esc}%`),
    limit: 8,
  });
}
