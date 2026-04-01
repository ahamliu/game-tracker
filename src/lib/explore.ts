import { and, asc, desc, eq, ilike, isNotNull, sql } from "drizzle-orm";
import { db } from "@/db";
import { characterRoutes, games, libraryEntries } from "@/db/schema";
import type { EntryStatus } from "@/lib/status";
import type { ProfileStatsData } from "@/app/u/[handle]/profile-stats";

export type ExploreSort = "popular" | "rated" | "newest";

export type CarouselEntry = {
  entryId: string;
  gameId: string;
  title: string;
  coverUrl: string | null;
  status: EntryStatus;
  routes: {
    id: string;
    name: string;
    imageUrl: string | null;
    cleared: boolean;
  }[];
  overflowRoutes: number;
};

const ROUTE_PREVIEW = 8;

export async function getCarouselForUser(userId: string): Promise<CarouselEntry[]> {
  const entries = await db.query.libraryEntries.findMany({
    where: eq(libraryEntries.userId, userId),
    with: {
      game: true,
      routes: {
        orderBy: (r, { asc: a }) => [a(r.sortOrder), a(r.createdAt)],
      },
    },
    orderBy: [desc(libraryEntries.updatedAt)],
    limit: 24,
  });

  return entries.map((e) => {
    const slice = e.routes.slice(0, ROUTE_PREVIEW);
    return {
      entryId: e.id,
      gameId: e.game.id,
      title: e.game.title,
      coverUrl: e.game.coverUrl,
      status: e.status,
      routes: slice.map((r) => ({
        id: r.id,
        name: r.name,
        imageUrl: r.imageUrl,
        cleared: r.status === "completed",
      })),
      overflowRoutes: Math.max(0, e.routes.length - ROUTE_PREVIEW),
    };
  });
}

export type PlayingRoute = {
  id: string;
  name: string;
  imageUrl: string | null;
  cleared: boolean;
};

export type PlayingEntry = {
  entryId: string;
  gameId: string;
  title: string;
  coverUrl: string | null;
  notes: string | null;
  routes: PlayingRoute[];
  overflowRoutes: number;
};

const PLAYING_ROUTE_PREVIEW = 6;

export async function getPlayingForUser(userId: string): Promise<PlayingEntry[]> {
  const entries = await db.query.libraryEntries.findMany({
    where: and(eq(libraryEntries.userId, userId), eq(libraryEntries.status, "playing")),
    with: {
      game: true,
      routes: {
        orderBy: (r, { asc: a }) => [a(r.sortOrder), a(r.createdAt)],
      },
    },
    orderBy: [desc(libraryEntries.updatedAt)],
    limit: 24,
  });

  return entries.map((e) => {
    const slice = e.routes.slice(0, PLAYING_ROUTE_PREVIEW);
    return {
      entryId: e.id,
      gameId: e.game.id,
      title: e.game.title,
      coverUrl: e.game.coverUrl,
      notes: e.notes,
      routes: slice.map((r) => ({
        id: r.id,
        name: r.name,
        imageUrl: r.imageUrl,
        cleared: r.status === "completed",
      })),
      overflowRoutes: Math.max(0, e.routes.length - PLAYING_ROUTE_PREVIEW),
    };
  });
}

export type PopularRow = {
  game: typeof games.$inferSelect;
  saves: number;
  avgPlayerRating: number | null;
  ratingLabel: "critic" | "players" | "none";
  ratingValue: number | null;
  ratingDisplay: string;
};

function ratingDisplayForGame(
  game: typeof games.$inferSelect,
  avgPlayer: number | null
): Pick<PopularRow, "ratingLabel" | "ratingValue" | "ratingDisplay"> {
  if (game.aggregatedRating != null) {
    return {
      ratingLabel: "critic",
      ratingValue: game.aggregatedRating,
      ratingDisplay: `${(game.aggregatedRating / 10).toFixed(1)}/10`,
    };
  }
  if (avgPlayer != null && !Number.isNaN(avgPlayer)) {
    const v = Math.round(avgPlayer * 10) / 10;
    return {
      ratingLabel: "players",
      ratingValue: v,
      ratingDisplay: `${v}/10`,
    };
  }
  return { ratingLabel: "none", ratingValue: null, ratingDisplay: "—" };
}

export async function getExplorePopular(params: {
  page: number;
  pageSize: number;
  q?: string;
  genreIds: number[];
  sort: ExploreSort;
}): Promise<{ rows: PopularRow[]; total: number }> {
  const { page, pageSize, q, genreIds, sort } = params;
  const offset = (page - 1) * pageSize;

  const pop = db
    .select({
      gameId: libraryEntries.gameId,
      saves: sql<number>`cast(count(distinct ${libraryEntries.userId}) as int)`.as("saves"),
      lastActivity: sql<Date>`max(${libraryEntries.updatedAt})`.as("last_activity"),
      avgPlayerRating: sql<number | null>`avg(${libraryEntries.rating})`.as("avg_player_rating"),
    })
    .from(libraryEntries)
    .groupBy(libraryEntries.gameId)
    .as("pop");

  const searchPattern = q?.trim()
    ? `%${q.trim().replace(/\\/g, "\\\\").replace(/%/g, "\\%").replace(/_/g, "\\_")}%`
    : null;

  const whereParts = [] as ReturnType<typeof sql>[];
  if (searchPattern) {
    whereParts.push(ilike(games.title, searchPattern));
  }
  if (genreIds.length > 0) {
    whereParts.push(
      sql`EXISTS (
        SELECT 1 FROM jsonb_array_elements(coalesce(${games.genres}, '[]'::jsonb)) AS elem
        WHERE (elem->>'id')::int IN (${sql.join(
          genreIds.map((id) => sql`${id}`),
          sql`, `
        )})
      )`
    );
  }

  const whereClause = whereParts.length ? and(...whereParts) : undefined;

  const baseCount = db
    .select({ c: sql<number>`cast(count(*) as int)` })
    .from(games)
    .innerJoin(pop, eq(games.id, pop.gameId))
    .where(whereClause);

  const [countRow] = await baseCount;
  const total = Number(countRow?.c ?? 0);

  const orderBy =
    sort === "newest"
      ? [desc(games.releaseDate), desc(pop.saves), asc(games.title)]
      : sort === "rated"
        ? [
            desc(sql`coalesce(${games.aggregatedRating}::float, ${pop.avgPlayerRating})`),
            desc(pop.saves),
            asc(games.title),
          ]
        : [desc(pop.saves), desc(pop.lastActivity), asc(games.title)];

  const data = await db
    .select({
      game: games,
      saves: pop.saves,
      avgPlayerRating: pop.avgPlayerRating,
    })
    .from(games)
    .innerJoin(pop, eq(games.id, pop.gameId))
    .where(whereClause)
    .orderBy(...orderBy)
    .limit(pageSize)
    .offset(offset);

  const rows: PopularRow[] = data.map((row) => {
    const avgPlayer =
      row.avgPlayerRating != null ? Number(row.avgPlayerRating) : null;
    const rd = ratingDisplayForGame(row.game, avgPlayer);
    return {
      game: row.game,
      saves: Number(row.saves),
      avgPlayerRating: avgPlayer,
      ...rd,
    };
  });

  return { rows, total };
}

export type RecentEntry = {
  entryId: string;
  gameId: string;
  title: string;
  coverUrl: string | null;
  developerName: string | null;
  addedAt: Date;
};

export async function getRecentlyAdded(limit = 12): Promise<RecentEntry[]> {
  const entries = await db.query.libraryEntries.findMany({
    with: { game: true },
    orderBy: [desc(libraryEntries.createdAt)],
    limit,
  });

  return entries.map((e) => ({
    entryId: e.id,
    gameId: e.gameId,
    title: e.game.title,
    coverUrl: e.game.coverUrl,
    developerName: e.game.developerName,
    addedAt: e.createdAt,
  }));
}

export async function getUserLibraryGameIds(userId: string): Promise<string[]> {
  const entries = await db
    .select({ gameId: libraryEntries.gameId })
    .from(libraryEntries)
    .where(eq(libraryEntries.userId, userId));
  return entries.map((e) => e.gameId);
}

export async function getStatsForUser(userId: string): Promise<ProfileStatsData> {
  const [statusRows, ratingRow, routeStats] = await Promise.all([
    db
      .select({
        status: libraryEntries.status,
        cnt: sql<number>`cast(count(*) as int)`,
      })
      .from(libraryEntries)
      .where(eq(libraryEntries.userId, userId))
      .groupBy(libraryEntries.status),
    db
      .select({ avg: sql<number | null>`avg(${libraryEntries.rating})` })
      .from(libraryEntries)
      .where(and(eq(libraryEntries.userId, userId), isNotNull(libraryEntries.rating))),
    db
      .select({
        total: sql<number>`cast(count(*) as int)`,
        completed: sql<number>`cast(count(*) filter (where ${characterRoutes.status} = 'completed') as int)`,
      })
      .from(characterRoutes)
      .innerJoin(libraryEntries, eq(characterRoutes.libraryEntryId, libraryEntries.id))
      .where(eq(libraryEntries.userId, userId)),
  ]);

  const statusCounts: Record<EntryStatus, number> = {
    planning: 0,
    playing: 0,
    completed: 0,
    on_hold: 0,
    dropped: 0,
  };
  for (const row of statusRows) {
    statusCounts[row.status as EntryStatus] = row.cnt;
  }
  const totalEntries = Object.values(statusCounts).reduce((a, b) => a + b, 0);
  const meanScore =
    ratingRow[0]?.avg != null ? Math.round(Number(ratingRow[0].avg) * 100) / 100 : null;

  return {
    statusCounts,
    totalEntries,
    meanScore,
    routesCompleted: routeStats[0]?.completed ?? 0,
    routesTotal: routeStats[0]?.total ?? 0,
  };
}

export async function getDistinctGenres(): Promise<{ id: number; name: string }[]> {
  const all = await db.query.games.findMany({
    columns: { genres: true },
  });
  const map = new Map<number, string>();
  for (const g of all) {
    if (!g.genres) continue;
    for (const x of g.genres) {
      if (x.id != null && x.name) map.set(x.id, x.name);
    }
  }
  return [...map.entries()]
    .map(([id, name]) => ({ id, name }))
    .sort((a, b) => a.name.localeCompare(b.name));
}
