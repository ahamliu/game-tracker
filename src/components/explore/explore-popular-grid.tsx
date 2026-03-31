import Image from "next/image";
import { BookmarkSimple, Star } from "@phosphor-icons/react/dist/ssr";
import type { PopularRow } from "@/lib/explore";

export function ExplorePopularGrid({ rows }: { rows: PopularRow[] }) {
  if (rows.length === 0) {
    return (
      <p className="rounded-[10px] border border-dashed border-border py-10 text-center text-[13px] text-muted-foreground">
        No games match your filters. Try clearing search or genres.
      </p>
    );
  }

  return (
    <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {rows.map(({ game, saves, ratingDisplay, ratingLabel }) => (
        <li key={game.id}>
          <article className="flex h-full gap-3 rounded-[10px] border border-transparent bg-card p-3 transition-all hover:border-[#646373] hover:shadow-[0_1px_1px_0_rgba(0,0,0,0.25)]">
            <div className="relative h-24 w-[66px] shrink-0 overflow-hidden rounded-lg bg-muted">
              {game.coverUrl ? (
                <Image src={game.coverUrl} alt="" fill className="object-cover" sizes="66px" />
              ) : (
                <div className="flex h-full items-center justify-center text-[9px] text-muted-foreground">—</div>
              )}
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="text-[13px] font-bold leading-snug text-[#646373] line-clamp-2">{game.title}</h3>
              {game.developerName && (
                <p className="mt-0.5 truncate text-[10px] font-medium uppercase text-muted-foreground">
                  {game.developerName}
                </p>
              )}
              <div className="mt-1.5 flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-1 text-[11px] font-medium text-muted-foreground">
                  <BookmarkSimple size={12} weight="fill" className="text-[#646373]" />
                  {saves.toLocaleString()}
                </span>
                {ratingLabel !== "none" && (
                  <span className="inline-flex items-center gap-1 text-[11px] font-medium text-muted-foreground">
                    <Star size={12} weight="fill" className="text-muted-foreground" />
                    {ratingDisplay}
                  </span>
                )}
              </div>
            </div>
          </article>
        </li>
      ))}
    </ul>
  );
}
