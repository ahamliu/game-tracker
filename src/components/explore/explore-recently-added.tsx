import Image from "next/image";
import Link from "next/link";
import type { RecentEntry } from "@/lib/explore";

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

export function ExploreRecentlyAdded({ entries }: { entries: RecentEntry[] }) {
  if (entries.length === 0) return null;

  return (
    <div>
      <h2 className="mb-3 text-[16px] font-bold text-[#646373]">Recently Added</h2>
      <div className="space-y-1">
        {entries.map((e) => (
          <Link
            key={e.entryId}
            href={`/library/${e.entryId}`}
            className="flex items-center gap-3 rounded-lg px-2 py-2 transition-colors hover:bg-muted/50"
          >
            <div className="relative h-14 w-10 shrink-0 overflow-hidden rounded bg-muted">
              {e.coverUrl ? (
                <Image src={e.coverUrl} alt="" fill className="object-cover" sizes="40px" />
              ) : (
                <div className="flex h-full items-center justify-center text-[8px] text-muted-foreground">—</div>
              )}
            </div>
            <div className="min-w-0 flex-1">
              {e.developerName && (
                <p className="truncate text-[10px] font-medium uppercase text-muted-foreground">
                  {e.developerName}
                </p>
              )}
              <p className="truncate text-[13px] font-medium text-foreground leading-snug">
                {e.title}
              </p>
              <p className="text-[11px] text-muted-foreground">
                {timeAgo(e.addedAt)}
              </p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
