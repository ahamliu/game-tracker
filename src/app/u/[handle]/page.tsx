import { notFound } from "next/navigation";
import { and, count, desc, eq } from "drizzle-orm";
import { auth } from "@/auth";
import { db } from "@/db";
import { activities, follows, users } from "@/db/schema";
import { ProfileFollowButton } from "./profile-follow-button";

type PageProps = { params: Promise<{ handle: string }> };

export default async function PublicProfilePage({ params }: PageProps) {
  const { handle } = await params;
  const h = handle.toLowerCase().trim();

  const user = await db.query.users.findFirst({ where: eq(users.handle, h) });
  if (!user) notFound();

  const session = await auth();
  const isSelf = session?.user?.id === user.id;

  const [{ fc }] = await db
    .select({ fc: count() })
    .from(follows)
    .where(eq(follows.followingId, user.id));

  const [{ fg }] = await db
    .select({ fg: count() })
    .from(follows)
    .where(eq(follows.followerId, user.id));

  let following = false;
  if (session?.user?.id && !isSelf) {
    const row = await db.query.follows.findFirst({
      where: and(eq(follows.followerId, session.user.id), eq(follows.followingId, user.id)),
    });
    following = !!row;
  }

  const recentActivity = await db.query.activities.findMany({
    where: eq(activities.userId, user.id),
    orderBy: [desc(activities.createdAt)],
    limit: 8,
  });

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{user.displayName}</h1>
          <p className="text-muted-foreground">@{user.handle}</p>
          {user.bio && <p className="mt-4 max-w-xl text-sm text-muted-foreground whitespace-pre-wrap">{user.bio}</p>}
          <p className="mt-4 text-sm text-muted-foreground">
            <span className="font-medium text-foreground">{fc}</span> followers ·{" "}
            <span className="font-medium text-foreground">{fg}</span> following
          </p>
        </div>
        {!isSelf && session && <ProfileFollowButton handle={user.handle} initialFollowing={following} />}
      </div>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Recent activity</h2>
        {recentActivity.length === 0 ? (
          <p className="text-sm text-muted-foreground">No activity yet.</p>
        ) : (
          <ul className="space-y-2 text-sm text-muted-foreground">
            {recentActivity.map((a) => (
              <li key={a.id}>
                <ActivityLine
                  activity={{ type: a.type, payload: a.payload as Record<string, unknown> }}
                />
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

function ActivityLine({
  activity,
}: {
  activity: { type: string; payload: Record<string, unknown> };
}) {
  const title = (activity.payload.gameTitle as string) ?? "A game";
  switch (activity.type) {
    case "completed":
      return <span>Completed {title}</span>;
    case "started":
      return <span>Started {title}</span>;
    case "rated":
      return (
        <span>
          Rated {title}{" "}
          {activity.payload.rating != null ? `(${activity.payload.rating}/10)` : ""}
        </span>
      );
    case "dropped":
      return <span>Dropped {title}</span>;
    case "on_hold":
      return <span>On hold: {title}</span>;
    default:
      return <span>Updated {title}</span>;
  }
}
