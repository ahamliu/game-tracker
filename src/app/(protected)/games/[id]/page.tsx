import Image from "next/image";
import { and, eq, sql } from "drizzle-orm";
import { notFound, redirect } from "next/navigation";
import { Star, BookmarkSimple } from "@phosphor-icons/react/dist/ssr";
import { auth } from "@/auth";
import { db } from "@/db";
import { games, libraryEntries } from "@/db/schema";
import { BackButton } from "@/components/back-button";
import { GameAddButton } from "./game-add-button";

type PageProps = { params: Promise<{ id: string }> };

export default async function GamePage({ params }: PageProps) {
  const session = await auth();
  const { id } = await params;

  const game = await db.query.games.findFirst({
    where: eq(games.id, id),
  });

  if (!game) notFound();

  if (session?.user?.id) {
    const existingEntry = await db.query.libraryEntries.findFirst({
      where: and(
        eq(libraryEntries.userId, session.user.id),
        eq(libraryEntries.gameId, game.id),
      ),
    });
    if (existingEntry) redirect(`/library/${existingEntry.id}`);
  }

  const savedCountResult = await db
    .select({ count: sql<number>`cast(count(distinct ${libraryEntries.userId}) as int)` })
    .from(libraryEntries)
    .where(eq(libraryEntries.gameId, game.id));
  const savedCount = Number(savedCountResult[0]?.count ?? 0);

  const releaseYear = game.releaseDate
    ? new Date(game.releaseDate).getFullYear()
    : null;

  const genres = (game.genres as { id: number; name: string }[] | null) ?? [];

  return (
    <div className="space-y-4">
      <div className="mx-auto max-w-[860px]">
        <BackButton />
      </div>

      <div className="mx-auto max-w-[860px] space-y-8 py-2">
        {/* Hero */}
        <div className="flex flex-col gap-5 sm:flex-row sm:gap-6">
          <div className="relative mx-auto h-[220px] w-[160px] shrink-0 overflow-hidden rounded-xl bg-muted shadow-md sm:mx-0">
            {game.coverUrl ? (
              <Image
                src={game.coverUrl}
                alt=""
                fill
                className="object-cover"
              />
            ) : (
              <div className="flex h-full items-center justify-center p-4 text-center text-xs text-muted-foreground">
                No cover
              </div>
            )}
          </div>

          <div className="flex min-w-0 flex-1 flex-col justify-between">
            <div>
              <h1 className="text-center text-[28px] font-bold leading-tight text-app-muted sm:text-left">
                {game.title}
              </h1>

              <div className="mt-1 space-y-1 text-[12px] font-medium uppercase text-muted-foreground sm:hidden">
                <div className="flex items-center justify-center gap-2">
                  {game.developerName && <span>{game.developerName}</span>}
                  {releaseYear && (
                    <>
                      {game.developerName && <span>&middot;</span>}
                      <span>{releaseYear}</span>
                    </>
                  )}
                </div>
                <div className="flex items-center justify-center gap-2">
                  {savedCount > 0 && (
                    <span className="inline-flex items-center gap-0.5">
                      <BookmarkSimple size={12} weight="fill" />
                      {savedCount.toLocaleString()}
                    </span>
                  )}
                  {game.aggregatedRating != null && (
                    <span className="inline-flex items-center gap-0.5">
                      <Star size={12} weight="fill" />
                      {(game.aggregatedRating / 10).toFixed(1)}/10
                    </span>
                  )}
                </div>
              </div>

              <p className="mt-1 hidden items-center gap-2 text-[12px] font-medium uppercase text-muted-foreground sm:flex">
                {game.developerName && <span>{game.developerName}</span>}
                {releaseYear && (
                  <>
                    {game.developerName && <span>·</span>}
                    <span>{releaseYear}</span>
                  </>
                )}
                {savedCount > 0 && (
                  <span className="inline-flex items-center gap-0.5">
                    <BookmarkSimple size={12} weight="fill" />
                    {savedCount.toLocaleString()}
                  </span>
                )}
                {game.aggregatedRating != null && (
                  <span className="inline-flex items-center gap-0.5">
                    <Star size={12} weight="fill" />
                    {(game.aggregatedRating / 10).toFixed(1)}/10
                  </span>
                )}
              </p>

              {genres.length > 0 && (
                <div className="mt-3 flex flex-wrap justify-center gap-1.5 sm:justify-start">
                  {genres.map((g) => (
                    <span
                      key={g.id}
                      className="rounded-full bg-muted px-2.5 py-0.5 text-[11px] font-medium text-muted-foreground"
                    >
                      {g.name}
                    </span>
                  ))}
                </div>
              )}

              {game.summary && (
                <p className="mt-4 max-w-2xl text-left text-[14px] leading-relaxed text-muted-foreground">
                  {game.summary}
                </p>
              )}
            </div>

            <div className="mt-6">
              <GameAddButton gameId={game.id} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
