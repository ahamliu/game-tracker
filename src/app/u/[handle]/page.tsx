import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { and, count, desc, eq, inArray, isNotNull, or, sql } from "drizzle-orm";
import {
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
  friendRequests,
  friendships,
  games,
  libraryEntries,
  users,
} from "@/db/schema";
import type { EntryStatus } from "@/lib/status";
import { CopyProfileUrl } from "@/app/(protected)/settings/copy-profile-url";
import { ProfileAvatar } from "./profile-avatar";
import { ProfileFriendButton, type FriendState } from "./profile-friend-button";
import { ProfileFavorites } from "./profile-favorites";
import { ProfileFriendCount } from "./profile-friends-list";
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
    [{ friendCount }],
    friendshipRow,
    sentRequest,
    receivedRequest,
    statusRows,
    ratingRow,
    routeStats,
    recentActivity,
    lastUpdates,
    favoriteGames,
    userLibrary,
  ] = await Promise.all([
    db.select({ friendCount: count() }).from(friendships).where(or(eq(friendships.userA, user.id), eq(friendships.userB, user.id))),
    session?.user?.id && !isSelf
      ? (() => {
          const [lo, hi] = session.user.id < user.id ? [session.user.id, user.id] : [user.id, session.user.id];
          return db.query.friendships.findFirst({
            where: and(eq(friendships.userA, lo), eq(friendships.userB, hi)),
          });
        })()
      : Promise.resolve(null),
    session?.user?.id && !isSelf
      ? db.query.friendRequests.findFirst({
          where: and(
            eq(friendRequests.senderId, session.user.id),
            eq(friendRequests.receiverId, user.id),
            eq(friendRequests.status, "pending"),
          ),
        })
      : Promise.resolve(null),
    session?.user?.id && !isSelf
      ? db.query.friendRequests.findFirst({
          where: and(
            eq(friendRequests.senderId, user.id),
            eq(friendRequests.receiverId, session.user.id),
            eq(friendRequests.status, "pending"),
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
      limit: 5,
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

  let friendState: FriendState = { kind: "none" };
  if (friendshipRow) {
    friendState = { kind: "friends", friendshipId: friendshipRow.id };
  } else if (sentRequest) {
    friendState = { kind: "request_sent" };
  } else if (receivedRequest) {
    friendState = { kind: "request_received", requestId: receivedRequest.id };
  }

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
    <div className="mx-auto max-w-[1380px] space-y-8 py-2">
      {/* Hero Section */}
      <section className="flex flex-wrap items-start gap-6">
        {/* Avatar */}
        <ProfileAvatar avatarUrl={user.avatarUrl} isSelf={isSelf} />

        {/* Info */}
        <div className="min-w-0 flex-1">
          <div className="flex flex-col md:flex-row md:items-center md:gap-3">
            <h1 className="font-display text-[24px] text-app-muted md:text-[32px]">
              {user.displayName}
            </h1>
            <span className="flex items-center gap-1 text-[14px] text-muted-foreground md:relative md:-top-[1px]">
              @{user.handle}
              <CopyProfileUrl handle={user.handle} />
            </span>
          </div>
          {user.bio && (
            <p className="mt-1 max-w-xl text-[13px] text-muted-foreground whitespace-pre-wrap">
              {user.bio}
            </p>
          )}
          <div className="mt-0.5 flex flex-wrap items-start gap-0.5 text-[13px] md:mt-3 md:gap-4">
            <ProfileFriendCount handle={user.handle} count={friendCount} />
            <span className="flex items-start gap-1.5 whitespace-nowrap text-muted-foreground">
              <CalendarBlank size={14} className="mt-[2px] shrink-0" />
              Joined {memberSince(user.createdAt)}
            </span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex shrink-0 items-center gap-2">
          {isSelf ? (
            <>
              <Link
                href="/settings"
                className="hidden items-center gap-1.5 rounded-lg border border-border px-4 py-2 font-mono text-[12px] font-semibold uppercase text-app-muted hover:bg-muted md:flex"
              >
                <GearSix size={14} weight="bold" />
                Settings
              </Link>
              <Link
                href="/settings"
                className="flex h-9 w-9 items-center justify-center rounded-lg border border-border text-app-muted hover:bg-muted md:hidden"
              >
                <GearSix size={18} weight="bold" />
              </Link>
            </>
          ) : session ? (
            <ProfileFriendButton
              targetUserId={user.id}
              initialState={friendState}
            />
          ) : null}
        </div>
      </section>

      {/* Two-column body */}
      <div className="grid gap-8 lg:grid-cols-[1fr_280px]">
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
            <h2 className="text-[16px] font-bold text-app-muted">Recent Activity</h2>
            {recentActivity.length === 0 ? (
              <p className="text-[13px] text-muted-foreground">No activity yet.</p>
            ) : (
              <div className="space-y-0">
                {recentActivity.map((a) => {
                  const payload = a.payload as Record<string, unknown>;
                  const title = (payload.gameTitle as string) ?? "A game";
                  const gameId = payload.gameId as string | undefined;
                  const label = STATUS_LABELS[a.type] ?? "Updated";
                  const ratingVal =
                    a.type === "rated" && payload.rating != null
                      ? ` (${payload.rating}/10)`
                      : "";

                  return (
                    <div
                      key={a.id}
                      className="flex items-center gap-3 rounded-lg pl-0 pr-2 py-1 transition-colors hover:bg-muted/50"
                    >
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-muted">
                        <GameController size={14} className="text-muted-foreground" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-[13px] text-app-muted">
                          <span className="font-medium text-muted-foreground">{label}:</span>{" "}
                          {gameId ? (
                            <Link href={`/games/${gameId}`} className="font-medium hover:underline">
                              {title}
                            </Link>
                          ) : (
                            <span className="font-medium">{title}</span>
                          )}
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
            <h3 className="mb-3 text-[14px] font-bold text-app-muted">Last Updates</h3>
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
                        <p className="truncate text-[12px] font-medium leading-snug text-app-muted">
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
