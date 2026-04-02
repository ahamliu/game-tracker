"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { BookmarkSimple, Star, Plus, CircleNotch } from "@phosphor-icons/react";
import { showSnackbar } from "@/components/snackbar";
import type { PopularRow } from "@/lib/explore";

export function ExplorePopularGrid({
  rows,
  libraryGameIds,
  signedIn = true,
}: {
  rows: PopularRow[];
  libraryGameIds: string[];
  signedIn?: boolean;
}) {
  const librarySet = useMemo(() => new Set(libraryGameIds), [libraryGameIds]);
  const [addedIds, setAddedIds] = useState<Set<string>>(new Set());
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const router = useRouter();

  async function addGame(gameId: string, title: string, e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    setLoadingId(gameId);
    try {
      const res = await fetch("/api/me/library", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ gameId, status: "playing" }),
      });
      if (res.ok || res.status === 409) {
        setAddedIds((prev) => new Set(prev).add(gameId));
        showSnackbar(`${title} added to library`);
        router.refresh();
      }
    } finally {
      setLoadingId(null);
    }
  }

  if (rows.length === 0) {
    return (
      <p className="rounded-[10px] border border-dashed border-border py-10 text-center text-[13px] text-muted-foreground">
        No games match your filters. Try clearing search or genres.
      </p>
    );
  }

  return (
    <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {rows.map(({ game, saves, ratingDisplay, ratingLabel }) => {
        const inLibrary = librarySet.has(game.id) || addedIds.has(game.id);
        const isLoading = loadingId === game.id;

        return (
          <li key={game.id}>
            <Link href={`/games/${game.id}`} className="group/card block h-full">
              <article className="relative flex h-full cursor-pointer gap-3 rounded-[10px] border border-transparent bg-card p-3 transition-all hover:border-app-muted hover:shadow-[0_1px_1px_0_rgba(0,0,0,0.25)]">
                <div className="relative h-24 w-[66px] shrink-0 overflow-hidden rounded-lg bg-muted">
                  {game.coverUrl ? (
                    <Image src={game.coverUrl} alt="" fill className="object-cover" sizes="66px" />
                  ) : (
                    <div className="flex h-full items-center justify-center text-[9px] text-muted-foreground">—</div>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="text-[16px] font-semibold leading-snug text-app-muted line-clamp-2">{game.title}</h3>
                  {game.developerName && (
                    <p className="mt-0.5 truncate text-[10px] font-medium uppercase text-muted-foreground">
                      {game.developerName}
                    </p>
                  )}
                  <div className="mt-1.5 flex flex-wrap items-center gap-2">
                    <span className="inline-flex items-center gap-1 text-[11px] font-medium text-muted-foreground">
                      <BookmarkSimple size={12} weight="fill" />
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

                <div className="absolute bottom-2 right-2 flex shrink-0 items-center opacity-0 transition-opacity group-hover/card:opacity-100">
                  {inLibrary ? (
                    <span className="inline-flex h-6 items-center rounded-md bg-[#D4D3DF] px-2 font-mono text-[11px] font-bold leading-none text-app-muted dark:text-[#656379]">
                      Added
                    </span>
                  ) : (
                    <div className="group/add relative">
                      <button
                        type="button"
                        onClick={(e) => {
                          if (!signedIn) {
                            e.preventDefault();
                            e.stopPropagation();
                            router.push("/login");
                            return;
                          }
                          addGame(game.id, game.title, e);
                        }}
                        disabled={isLoading}
                        className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#D4D3DF] text-app-muted transition-all hover:opacity-80 disabled:opacity-40 dark:text-[#656379]"
                      >
                        {isLoading ? (
                          <CircleNotch size={14} className="animate-spin" />
                        ) : (
                          <Plus size={14} weight="bold" />
                        )}
                      </button>
                      <span className="pointer-events-none absolute -top-8 right-0 whitespace-nowrap rounded bg-[#333] px-2 py-1 text-[11px] text-white opacity-0 shadow transition-opacity group-hover/add:opacity-100 dark:bg-[#e5e5e5] dark:text-[#1a1a1a]">
                        {signedIn ? "Add to library" : "Sign in to add"}
                      </span>
                    </div>
                  )}
                </div>
              </article>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
