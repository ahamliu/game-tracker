import { desc, eq, sql, inArray } from "drizzle-orm";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { db } from "@/db";
import { libraryEntries, users } from "@/db/schema";
import { LibraryContent } from "./library-content";

export default async function LibraryPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const user = await db.query.users.findFirst({
    where: eq(users.id, session.user.id),
  });

  const entries = await db.query.libraryEntries.findMany({
    where: eq(libraryEntries.userId, session.user.id),
    with: { game: true, routes: true },
    orderBy: [desc(libraryEntries.createdAt)],
  });

  const gameIds = [...new Set(entries.map((e) => e.gameId))];

  const savedCounts: Record<string, number> = {};
  if (gameIds.length > 0) {
    const rows = await db
      .select({
        gameId: libraryEntries.gameId,
        count: sql<number>`cast(count(distinct ${libraryEntries.userId}) as int)`,
      })
      .from(libraryEntries)
      .where(inArray(libraryEntries.gameId, gameIds))
      .groupBy(libraryEntries.gameId);

    for (const r of rows) {
      savedCounts[r.gameId] = r.count;
    }
  }

  return (
    <LibraryContent
      user={{
        displayName: user?.displayName ?? "User",
        handle: user?.handle ?? "",
        avatarUrl: user?.avatarUrl ?? null,
        createdAt: user?.createdAt ?? new Date(),
      }}
      entries={entries.map((e) => ({
        id: e.id,
        status: e.status,
        rating: e.rating,
        createdAt: e.createdAt,
        game: {
          id: e.game.id,
          title: e.game.title,
          coverUrl: e.game.coverUrl,
          developerName: e.game.developerName,
          releaseDate: e.game.releaseDate,
          savedCount: savedCounts[e.gameId] ?? 0,
        },
        routes: e.routes.map((r) => ({
          id: r.id,
          name: r.name,
          imageUrl: r.imageUrl,
          status: r.status,
        })),
      }))}
    />
  );
}
