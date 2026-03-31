import Link from "next/link";
import { Bookmark, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { CarouselEntry } from "@/lib/explore";
import { statusLabel } from "@/lib/status";

export function ExploreLibraryCarousel({ entries }: { entries: CarouselEntry[] }) {
  if (entries.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-border bg-muted/30 p-8 text-center">
        <p className="text-muted-foreground">No games in your library yet.</p>
        <Button asChild className="mt-4" variant="secondary">
          <Link href="/library">Go to library</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-lg font-semibold tracking-tight">Your library</h2>
        <Button asChild variant="default" size="sm">
          <Link href="/library">View full library</Link>
        </Button>
      </div>
      <div className="flex gap-4 overflow-x-auto pb-2 pt-1 [scrollbar-gutter:stable] snap-x snap-mandatory">
        {entries.map((e) => (
          <Link
            key={e.entryId}
            href={`/library/${e.entryId}`}
            className="snap-start shrink-0 w-[200px] rounded-xl border border-border bg-card p-3 shadow-sm transition-colors hover:border-primary/40"
          >
            <div className="relative mx-auto aspect-[2/3] w-full max-w-[120px] overflow-hidden rounded-lg bg-muted">
              {e.coverUrl ? (
                <img src={e.coverUrl} alt="" className="h-full w-full object-cover" />
              ) : (
                <div className="flex h-full items-center justify-center text-xs text-muted-foreground">No cover</div>
              )}
            </div>
            <p className="mt-2 line-clamp-2 text-center text-sm font-medium leading-tight">{e.title}</p>
            <p className="mt-1 text-center text-xs text-muted-foreground">{statusLabel(e.status)}</p>
            {e.routes.length > 0 && (
              <div className="mt-2 flex flex-wrap justify-center gap-1">
                {e.routes.map((r) => (
                  <div
                    key={r.id}
                    className="relative h-9 w-9 shrink-0"
                    title={r.name}
                    aria-label={
                      r.cleared ? `Route completed: ${r.name}` : `Route not completed: ${r.name}`
                    }
                  >
                    <div
                      className={`h-9 w-9 overflow-hidden rounded-full border border-border bg-muted ${
                        r.cleared ? "" : "grayscale"
                      }`}
                    >
                      {r.imageUrl ? (
                        <img src={r.imageUrl} alt="" className="h-full w-full object-cover" />
                      ) : (
                        <div className="flex h-full items-center justify-center text-[10px] font-medium text-muted-foreground">
                          {r.name.slice(0, 1).toUpperCase()}
                        </div>
                      )}
                    </div>
                    {r.cleared && (
                      <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-emerald-600 text-white shadow">
                        <Check className="h-2.5 w-2.5" strokeWidth={3} aria-hidden />
                      </span>
                    )}
                  </div>
                ))}
                {e.overflowRoutes > 0 && (
                  <span className="flex h-9 w-9 items-center justify-center rounded-full border border-dashed border-border text-xs text-muted-foreground">
                    +{e.overflowRoutes}
                  </span>
                )}
              </div>
            )}
          </Link>
        ))}
      </div>
    </div>
  );
}

export function ExploreSignedOutCarousel() {
  return (
    <div className="rounded-xl border border-border bg-card p-8 text-center">
      <Bookmark className="mx-auto h-10 w-10 text-muted-foreground" aria-hidden />
      <p className="mt-3 text-muted-foreground">Sign in to see your games and character route progress here.</p>
      <div className="mt-4 flex flex-wrap justify-center gap-2">
        <Button asChild>
          <Link href="/login">Sign in</Link>
        </Button>
        <Button asChild variant="outline">
          <Link href="/register">Create account</Link>
        </Button>
      </div>
    </div>
  );
}
