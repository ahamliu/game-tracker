import Image from "next/image";
import Link from "next/link";
import { Ghost } from "@phosphor-icons/react/dist/ssr";
import { ProfileStatsSidebar, type ProfileStatsData } from "@/app/u/[handle]/profile-stats";
import type { FriendUpdate } from "@/lib/explore";

const STATUS_LABELS: Record<string, string> = {
  completed: "Completed",
  started: "Started",
  rated: "Rated",
  dropped: "Dropped",
  on_hold: "On hold",
};

function timeAgo(date: Date): string {
  const now = Date.now();
  const diff = now - new Date(date).getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  if (days < 30) return `${Math.floor(days / 7)}w ago`;
  return `${Math.floor(days / 30)}mo ago`;
}

export function ExploreHomeSidebar({ stats, friendUpdates = [] }: { stats: ProfileStatsData; friendUpdates?: FriendUpdate[] }) {
  return (
    <div className="space-y-5">
      <div>
        <h2 className="mb-3 text-[16px] font-bold text-app-muted">My Statistics</h2>
        <ProfileStatsSidebar data={stats} compact />
      </div>

      <div className="border-t border-border pt-5">
        <h2 className="text-[16px] font-bold text-app-muted">Friend Updates</h2>
        {friendUpdates.length === 0 ? (
          <p className="mt-3 text-[12px] text-muted-foreground">
            No friend updates yet.
          </p>
        ) : (
          <div className="mt-3 space-y-0">
            {friendUpdates.map((u) => {
              const title = (u.payload.gameTitle as string) ?? "A game";
              const gameId = u.payload.gameId as string | undefined;
              const label = STATUS_LABELS[u.type] ?? "Updated";
              const ratingVal =
                u.type === "rated" && u.payload.rating != null
                  ? ` (${u.payload.rating}/10)`
                  : "";

              return (
                <div
                  key={u.id}
                  className="flex items-start gap-2.5 rounded-lg py-1.5 transition-colors hover:bg-muted/50"
                >
                  <Link
                    href={`/u/${u.userHandle}`}
                    className="relative mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center overflow-hidden rounded-full bg-[#656379]"
                  >
                    {u.userAvatarUrl ? (
                      <Image src={u.userAvatarUrl} alt="" fill unoptimized className="rounded-full object-cover" />
                    ) : (
                      <Ghost size={10} className="text-white" />
                    )}
                  </Link>
                  <div className="min-w-0 flex-1">
                    <p className="text-[13px] leading-relaxed text-app-muted">
                      <Link href={`/u/${u.userHandle}`} className="font-bold hover:underline">
                        {u.userDisplayName}
                      </Link>{" "}
                      <span className="text-muted-foreground">{label.toLowerCase()}</span>{" "}
                      {gameId ? (
                        <Link href={`/games/${gameId}`} className="font-medium hover:underline">
                          {title}
                        </Link>
                      ) : (
                        <span className="font-medium">{title}</span>
                      )}
                      {ratingVal}
                    </p>
                    <p className="text-[10px] text-muted-foreground">{timeAgo(u.createdAt)}</p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
