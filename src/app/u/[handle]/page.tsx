import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { and, count, desc, eq, inArray, isNotNull, sql } from "drizzle-orm";
import {
  Ghost,
  CalendarBlank,
  GearSix,
  GameController,
  Star,
  ArrowRight,
} from "@phosphor-icons/react/dist/ssr";
import { auth } from "@/auth";
import { db } from "@/db";
import {
  activities,
  characterRoutes,
  follows,
  games,
  libraryEntries,
  users,
} from "@/db/schema";
import type { EntryStatus } from "@/lib/status";
import { ProfileFollowButton } from "./profile-follow-button";
import { ProfileFavorites } from "./profile-favorites";
import { ProfileStats, ProfileStatsSidebar, type ProfileStatsData } from "./profile-stats";

type PageProps = { params: Promise<{ handle: string }> };

function timeAgo(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - new Date(date).getTime();
  const mins = Math.floor(diffMs / 60_000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  if (days < 30) return `${Math.floor(days / 7)}w ago`;
  return `${Math.floor(days / 30)}mo ago`;
}

function memberSince(date: Date): string {
  return new Date(date).toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });
}

export default async function PublicProfilePage({ params }: PageProps) {
  const { handle } = await params;
  const h = handle.toLowerCase().trim();

  const user = await db.query.users.findFirst({ where: eq(users.handle, h) });
  if (!user) notFound();

  const session = await auth();
  const isSelf = session?.user?.id === user.id;

  const [
    [{ fc }],
    [{ fg }],
    followRow,
    statusRows,
    ratingRow,
    routeStats,
    recentActivity,
    lastUpdates,
    favoriteGames,
    userLibrary,
  ] = await Promise.all([
    db.select({ fc: count() }).from(follows).where(eq(follows.followingId, user.id)),
    db.select({ fg: count() }).from(follows).where(eq(follows.followerId, user.id)),
    session?.user?.id && !isSelf
      ? db.query.follows.findFirst({
          where: and(
            eq(follows.followerId, session.user.id),
            eq(follows.followingId, user.id)
          ),
        })
      : Promise.resolve(null),
    db
      .select({
        status: libraryEntries.status,
        cnt: sql<number>`cast(count(*) as int)`,
      })
      .from(libraryEntries)
      .where(eq(libraryEntries.userId, user.id))
      .groupBy(libraryEntries.status),
    db
      .select({
        avg: sql<number | null>`avg(${libraryEntries.rating})`,
        rated: sql<number>`cast(count(${libraryEntries.rating}) as int)`,
      })
      .from(libraryEntries)
      .where(and(eq(libraryEntries.userId, user.id), isNotNull(libraryEntries.rating))),
    db
      .select({
        total: sql<number>`cast(count(*) as int)`,
        completed: sql<number>`cast(count(*) filter (where ${characterRoutes.status} = 'completed') as int)`,
      })
      .from(characterRoutes)
      .innerJoin(
        libraryEntries,
        eq(characterRoutes.libraryEntryId, libraryEntries.id)
      )
      .where(eq(libraryEntries.userId, user.id)),
    db.query.activities.findMany({
      where: eq(activities.userId, user.id),
      orderBy: [desc(activities.createdAt)],
      limit: 10,
    }),
    // Last game updates: recent entries with game data
    db.query.libraryEntries.findMany({
      where: eq(libraryEntries.userId, user.id),
      with: { game: true },
      orderBy: [desc(libraryEntries.updatedAt)],
      limit: 5,
    }),
    // Favorite games
    user.favoriteGameIds && (user.favoriteGameIds as string[]).length > 0
      ? db.query.games.findMany({
          where: inArray(games.id, user.favoriteGameIds as string[]),
        })
      : Promise.resolve([]),
    // User's full library for the favorites modal (only if self)
    isSelf
      ? db.query.libraryEntries.findMany({
          where: eq(libraryEntries.userId, user.id),
          with: { game: true },
          orderBy: [desc(libraryEntries.updatedAt)],
        })
      : Promise.resolve(null),
  ]);

  const following = !!followRow;

  // Build status counts
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
  const routesCompleted = routeStats[0]?.completed ?? 0;
  const routesTotal = routeStats[0]?.total ?? 0;

  const statsData: ProfileStatsData = {
    statusCounts,
    totalEntries,
    meanScore,
    routesCompleted,
    routesTotal,
  };

  // Order favorite games by the user's chosen order
  const favIds = (user.favoriteGameIds as string[]) ?? [];
  const orderedFavorites = favIds
    .map((id) => favoriteGames.find((g) => g.id === id))
    .filter((g): g is NonNullable<typeof g> => g != null)
    .map((g) => ({
      id: g.id,
      title: g.title,
      coverUrl: g.coverUrl,
      developerName: g.developerName,
    }));

  const libraryForModal = userLibrary
    ? userLibrary.map((e) => ({
        gameId: e.game.id,
        title: e.game.title,
        coverUrl: e.game.coverUrl,
        developerName: e.game.developerName,
        rating: e.rating,
      }))
    : undefined;

  const STATUS_LABELS: Record<string, string> = {
    completed: "Completed",
    started: "Started",
    rated: "Rated",
    dropped: "Dropped",
    on_hold: "On hold",
  };

  return (
    <div className="mx-auto max-w-[960px] space-y-8 py-2">
      {/* Hero Section */}
      <section className="flex flex-wrap items-start gap-6">
        {/* Avatar */}
        <div className="flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden rounded-full bg-[hsl(248,11%,43%)]">
          {user.avatarUrl ? (
            <Image
              src={user.avatarUrl}
              alt={user.displayName}
              width={96}
              height={96}
              className="h-full w-full object-cover"
            />
          ) : (
            <Ghost size={40} weight="fill" className="text-white" />
          )}
        </div>

        {/* Info */}
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-3">
            <h1 className="font-display text-[32px] text-[#646373]">
              {user.displayName}
            </h1>
            <span className="relative -top-[1px] text-[14px] text-muted-foreground">
              @{user.handle}
            </span>
          </div>
          {user.bio && (
            <p className="mt-1 max-w-xl text-[13px] text-muted-foreground whitespace-pre-wrap">
              {user.bio}
            </p>
          )}
          <div className="mt-3 flex flex-wrap items-center gap-4 text-[13px]">
            <span className="flex items-center gap-1.5">
              <span className="font-bold text-[#646373]">{fc}</span>
              <span className="text-muted-foreground">followers</span>
            </span>
            <span className="flex items-center gap-1.5">
              <span className="font-bold text-[#646373]">{fg}</span>
              <span className="text-muted-foreground">following</span>
            </span>
            <span className="flex items-center gap-1.5 text-muted-foreground">
              <CalendarBlank size={14} />
              Joined {memberSince(user.createdAt)}
            </span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex shrink-0 items-center gap-2">
          {isSelf ? (
            <Link
              href="/settings"
              className="flex items-center gap-1.5 rounded-lg border border-border px-4 py-2 font-mono text-[12px] font-semibold uppercase text-[#646373] hover:bg-muted"
            >
              <GearSix size={14} weight="bold" />
              Settings
            </Link>
          ) : session ? (
            <ProfileFollowButton
              handle={user.handle}
              initialFollowing={following}
            />
          ) : null}
        </div>
      </section>

      {/* Two-column body */}
      <div className="grid gap-8 lg:grid-cols-[1fr_260px]">
        {/* Left column */}
        <div className="space-y-8">
          {/* Favorites */}
          <section>
            <ProfileFavorites
              favorites={orderedFavorites}
              isSelf={isSelf}
              library={libraryForModal}
            />
          </section>

          {/* Game Statistics */}
          <section>
            <ProfileStats data={statsData} />
          </section>

          {/* Recent Activity */}
          <section className="space-y-3">
            <h2 className="text-[16px] font-bold text-[#646373]">Recent Activity</h2>
            {recentActivity.length === 0 ? (
              <p className="text-[13px] text-muted-foreground">No activity yet.</p>
            ) : (
              <div className="space-y-1">
                {recentActivity.map((a) => {
                  const payload = a.payload as Record<string, unknown>;
                  const title = (payload.gameTitle as string) ?? "A game";
                  const label = STATUS_LABELS[a.type] ?? "Updated";
                  const ratingVal =
                    a.type === "rated" && payload.rating != null
                      ? ` (${payload.rating}/10)`
                      : "";

                  return (
                    <div
                      key={a.id}
                      className="flex items-center gap-3 rounded-lg px-2 py-2 transition-colors hover:bg-muted/50"
                    >
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-muted">
                        <GameController size={14} className="text-muted-foreground" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-[13px] text-foreground">
                          <span className="font-medium text-muted-foreground">{label}:</span>{" "}
                          <span className="font-medium">{title}</span>
                          {ratingVal}
                        </p>
                      </div>
                      <span className="shrink-0 text-[11px] text-muted-foreground">
                        {timeAgo(a.createdAt)}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        </div>

        {/* Right column / sidebar */}
        <div className="space-y-6">
          {/* Status breakdown */}
          <div className="rounded-[10px] border border-border bg-card p-4">
            <ProfileStatsSidebar data={statsData} />
          </div>

          {/* Last Game Updates */}
          <div className="rounded-[10px] border border-border bg-card p-4">
            <h3 className="mb-3 text-[14px] font-bold text-[#646373]">Last Updates</h3>
            {lastUpdates.length === 0 ? (
              <p className="text-[12px] text-muted-foreground">No entries yet.</p>
            ) : (
              <div className="space-y-1">
                {lastUpdates.map((entry) => {
                  const statusLabel: Record<string, string> = {
                    planning: "Not Started",
                    playing: "Playing",
                    completed: "Completed",
                    on_hold: "On Hold",
                    dropped: "Dropped",
                  };

                  return (
                    <Link
                      key={entry.id}
                      href={`/library/${entry.id}`}
                      className="flex items-center gap-2.5 rounded-lg px-1.5 py-1.5 transition-colors hover:bg-muted/50"
                    >
                      <div className="relative h-12 w-9 shrink-0 overflow-hidden rounded bg-muted">
                        {entry.game.coverUrl ? (
                          <Image
                            src={entry.game.coverUrl}
                            alt=""
                            fill
                            className="object-cover"
                            sizes="36px"
                          />
                        ) : (
                          <div className="flex h-full items-center justify-center text-[7px] text-muted-foreground">
                            —
                          </div>
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-[12px] font-medium leading-snug text-foreground">
                          {entry.game.title}
                        </p>
                        <p className="text-[10px] text-muted-foreground">
                          {statusLabel[entry.status] ?? entry.status}
                          {entry.rating != null && (
                            <>
                              {" · "}
                              <Star
                                size={10}
                                weight="fill"
                                className="inline text-muted-foreground"
                              />{" "}
                              {entry.rating}/10
                            </>
                          )}
                        </p>
                      </div>
                      <span className="shrink-0 text-[10px] text-muted-foreground">
                        {timeAgo(entry.updatedAt)}
                      </span>
                    </Link>
                  );
                })}
              </div>
            )}

            {totalEntries > 5 && (
              <Link
                href={isSelf ? "/library" : "#"}
                className="mt-2 flex items-center justify-center gap-1 text-[11px] font-medium text-[#656379] hover:underline"
              >
                View all <ArrowRight size={10} />
              </Link>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
