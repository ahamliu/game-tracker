import { and, eq, sql } from "drizzle-orm";
import { notFound, redirect } from "next/navigation";
import { auth } from "@/auth";
import { db } from "@/db";
import { libraryEntries } from "@/db/schema";
import { BackButton } from "@/components/back-button";
import { EntryDetail } from "@/components/entry-detail";

type PageProps = { params: Promise<{ entryId: string }> };

export default async function EntryPage({ params }: PageProps) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const { entryId } = await params;

  const entry = await db.query.libraryEntries.findFirst({
    where: and(eq(libraryEntries.id, entryId), eq(libraryEntries.userId, session.user.id)),
    with: {
      game: true,
      routes: {
        orderBy: (routes, { asc }) => [asc(routes.sortOrder), asc(routes.createdAt)],
      },
    },
  });

  if (!entry) notFound();

  const savedCountResult = await db
    .select({ count: sql<number>`count(distinct ${libraryEntries.userId})` })
    .from(libraryEntries)
    .where(eq(libraryEntries.gameId, entry.gameId));
  const savedCount = Number(savedCountResult[0]?.count ?? 0);

  return (
    <div className="space-y-4">
      <div className="mx-auto max-w-[860px]">
        <BackButton />
      </div>
      <EntryDetail
        entryId={entry.id}
        initial={{
          status: entry.status,
          rating: entry.rating,
          notes: entry.notes,
          progressPercent: entry.progressPercent,
          progressNote: entry.progressNote,
          game: {
            id: entry.game.id,
            title: entry.game.title,
            coverUrl: entry.game.coverUrl,
            summary: entry.game.summary,
            developerName: entry.game.developerName,
            releaseDate: entry.game.releaseDate,
            savedCount,
            aggregatedRating: entry.game.aggregatedRating,
            source: entry.game.source,
          },
          routes: entry.routes.map((r) => ({
            id: r.id,
            name: r.name,
            sortOrder: r.sortOrder,
            imageUrl: r.imageUrl,
            status: r.status,
            rating: r.rating,
            notes: r.notes,
          })),
        }}
      />
    </div>
  );
}
