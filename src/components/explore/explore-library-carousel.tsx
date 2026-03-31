import Image from "next/image";
import Link from "next/link";
import { Ghost } from "@phosphor-icons/react/dist/ssr";
import type { CarouselEntry } from "@/lib/explore";
import { statusLabel } from "@/lib/status";

export function ExploreLibraryCarousel({ entries }: { entries: CarouselEntry[] }) {
  if (entries.length === 0) {
    return (
      <div className="rounded-[10px] border border-dashed border-border px-6 py-10 text-center">
        <p className="text-[13px] text-muted-foreground">
          No games in your library yet. Use the search bar to add your first game.
        </p>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-[16px] font-bold text-[#646373]">Your Library</h2>
        <Link
          href="/library"
          className="text-[12px] font-medium text-[#656379] hover:underline"
        >
          View all
        </Link>
      </div>
      <div className="flex gap-3 overflow-x-auto pb-2 snap-x snap-mandatory">
        {entries.map((e) => (
          <Link
            key={e.entryId}
            href={`/library/${e.entryId}`}
            className="snap-start shrink-0 w-[130px] rounded-[10px] border border-transparent bg-card p-2.5 transition-all hover:border-[#646373] hover:shadow-[0_1px_1px_0_rgba(0,0,0,0.25)]"
          >
            <div className="relative mx-auto aspect-[2/3] w-full overflow-hidden rounded-lg bg-muted">
              {e.coverUrl ? (
                <Image src={e.coverUrl} alt="" fill className="object-cover" sizes="130px" />
              ) : (
                <div className="flex h-full items-center justify-center text-[10px] text-muted-foreground">No cover</div>
              )}
            </div>
            <p className="mt-2 line-clamp-2 text-[12px] font-medium leading-tight text-[#646373]">{e.title}</p>
            <p className="mt-0.5 text-[10px] font-medium uppercase text-muted-foreground">{statusLabel(e.status)}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}

export function ExploreSignedOutCarousel() {
  return (
    <div className="rounded-[10px] border border-border bg-card px-6 py-10 text-center">
      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-[hsl(248,11%,43%)]">
        <Ghost size={24} className="text-white" />
      </div>
      <p className="mt-3 text-[13px] text-muted-foreground">
        Sign in to see your library and track progress.
      </p>
      <div className="mt-4 flex justify-center gap-2">
        <Link
          href="/login"
          className="rounded-lg bg-[#656379] px-5 py-2 font-mono text-[12px] font-semibold uppercase text-white hover:opacity-90"
        >
          Sign in
        </Link>
        <Link
          href="/register"
          className="rounded-lg border border-border px-5 py-2 font-mono text-[12px] font-semibold uppercase text-[#646373] hover:bg-muted"
        >
          Register
        </Link>
      </div>
    </div>
  );
}
