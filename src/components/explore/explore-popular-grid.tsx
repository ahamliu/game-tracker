import { Bookmark, Star } from "lucide-react";
import type { PopularRow } from "@/lib/explore";

export function ExplorePopularGrid({ rows }: { rows: PopularRow[] }) {
  if (rows.length === 0) {
    return (
      <p className="rounded-xl border border-dashed border-border py-12 text-center text-muted-foreground">
        No games match your filters yet. Try clearing search or genres—or add games from IGDB so others can discover them.
      </p>
    );
  }

  return (
    <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {rows.map(({ game, saves, ratingDisplay, ratingLabel }) => (
        <li key={game.id}>
          <article className="flex h-full flex-col overflow-hidden rounded-xl border border-border bg-card shadow-sm transition-colors hover:border-primary/30">
            <div className="flex gap-3 p-3">
              <div className="relative h-28 w-20 shrink-0 overflow-hidden rounded-lg bg-muted">
                {game.coverUrl ? (
                  <img src={game.coverUrl} alt="" className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full items-center justify-center text-[10px] text-muted-foreground">
                    —
                  </div>
                )}
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="font-semibold leading-snug line-clamp-2">{game.title}</h3>
                <p className="mt-1 flex items-center gap-1.5 text-sm text-muted-foreground">
                  <Bookmark className="h-4 w-4 shrink-0 text-primary" aria-hidden />
                  <span>
                    <span className="sr-only">Saved by </span>
                    {saves.toLocaleString()} {saves === 1 ? "user" : "users"}
                  </span>
                </p>
                <p className="mt-1 flex items-center gap-1.5 text-sm text-muted-foreground">
                  <Star className="h-4 w-4 shrink-0 text-amber-500" aria-hidden />
                  <span>
                    {ratingLabel === "critic" && <span className="mr-1 text-xs uppercase text-muted-foreground">Critic</span>}
                    {ratingLabel === "players" && <span className="mr-1 text-xs uppercase text-muted-foreground">Players</span>}
                    {ratingDisplay}
                  </span>
                </p>
                <p className="mt-1 text-xs text-muted-foreground line-clamp-1">
                  {game.developerName?.trim() || "Unknown developer"}
                </p>
              </div>
            </div>
            {game.genres && game.genres.length > 0 && (
              <div className="mt-auto flex flex-wrap gap-1.5 border-t border-border px-3 py-2">
                {game.genres.map((g) => (
                  <span
                    key={g.id}
                    className="rounded-full border border-border bg-muted/50 px-2.5 py-0.5 text-xs font-medium text-muted-foreground"
                  >
                    {g.name}
                  </span>
                ))}
              </div>
            )}
          </article>
        </li>
      ))}
    </ul>
  );
}
