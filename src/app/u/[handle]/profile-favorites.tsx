"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  Heart,
  Plus,
  X,
  MagnifyingGlass,
  PencilSimple,
  SpinnerGap,
  Check,
} from "@phosphor-icons/react";

type FavoriteGame = {
  id: string;
  title: string;
  coverUrl: string | null;
  developerName: string | null;
};

type LibraryGame = {
  gameId: string;
  title: string;
  coverUrl: string | null;
  developerName: string | null;
  rating: number | null;
};

export function ProfileFavorites({
  favorites,
  isSelf,
  library,
}: {
  favorites: FavoriteGame[];
  isSelf: boolean;
  library?: LibraryGame[];
}) {
  const [editing, setEditing] = useState(false);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="flex items-center gap-2 text-[16px] font-bold text-[#646373]">
          <Heart size={18} weight="fill" className="text-[#C25450]" />
          Favorites
        </h2>
        {isSelf && (
          <button
            type="button"
            onClick={() => setEditing(true)}
            className="flex items-center gap-1 text-[12px] text-muted-foreground hover:text-foreground"
          >
            <PencilSimple size={12} />
            Edit
          </button>
        )}
      </div>

      {favorites.length === 0 && !isSelf && (
        <p className="text-[13px] text-muted-foreground">No favorites selected yet.</p>
      )}

      <div className="flex gap-3">
        {favorites.map((game) => (
          <FavoriteCard key={game.id} game={game} />
        ))}
        {isSelf &&
          Array.from({ length: Math.max(0, 5 - favorites.length) }).map((_, i) => (
            <button
              key={`empty-${i}`}
              type="button"
              onClick={() => setEditing(true)}
              className="flex aspect-[3/4] min-w-0 flex-1 items-center justify-center rounded-[10px] border border-dashed border-border bg-muted/30 transition-colors hover:border-[#646373] hover:bg-muted/50"
            >
              <Plus size={20} className="text-muted-foreground" />
            </button>
          ))}
      </div>

      {editing && library && (
        <EditFavoritesModal
          currentFavorites={favorites}
          library={library}
          onClose={() => setEditing(false)}
        />
      )}
    </div>
  );
}

function FavoriteCard({ game }: { game: FavoriteGame }) {
  return (
    <Link
      href={`/games/${game.id}`}
      className="group min-w-0 flex-1"
    >
      <div className="relative aspect-[3/4] w-full overflow-hidden rounded-[10px] bg-muted">
        {game.coverUrl ? (
          <Image src={game.coverUrl} alt="" fill className="object-cover" sizes="20vw" />
        ) : (
          <div className="flex h-full items-center justify-center text-[10px] text-muted-foreground">
            No cover
          </div>
        )}
        <div className="absolute inset-0 rounded-[10px] transition-[backdrop-filter] duration-200 group-hover:backdrop-saturate-[1.4] group-hover:backdrop-contrast-[1.05]" />
      </div>
      <p className="mt-1.5 line-clamp-2 text-[11px] font-medium leading-tight text-[#646373]">
        {game.title}
      </p>
    </Link>
  );
}

function EditFavoritesModal({
  currentFavorites,
  library,
  onClose,
}: {
  currentFavorites: FavoriteGame[];
  library: LibraryGame[];
  onClose: () => void;
}) {
  const router = useRouter();
  const overlayRef = useRef<HTMLDivElement>(null);
  const [selected, setSelected] = useState<LibraryGame[]>(() => {
    const ids = currentFavorites.map((f) => f.id);
    return ids
      .map((id) => library.find((g) => g.gameId === id))
      .filter((g): g is LibraryGame => g != null);
  });
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState("");

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  const toggleGame = useCallback(
    (game: LibraryGame) => {
      setSelected((prev) => {
        const exists = prev.find((g) => g.gameId === game.gameId);
        if (exists) return prev.filter((g) => g.gameId !== game.gameId);
        if (prev.length >= 5) return prev;
        return [...prev, game];
      });
    },
    []
  );

  async function save() {
    setSaving(true);
    try {
      await fetch("/api/me/favorites", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ gameIds: selected.map((g) => g.gameId) }),
      });
      router.refresh();
      onClose();
    } catch {
      setSaving(false);
    }
  }

  const filtered = search.trim()
    ? library.filter((g) =>
        g.title.toLowerCase().includes(search.trim().toLowerCase())
      )
    : library;

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-50 flex items-start justify-center bg-black/50 pt-[10vh]"
      onClick={(e) => {
        if (e.target === overlayRef.current) onClose();
      }}
    >
      <div className="w-full max-w-[520px] overflow-hidden rounded-xl border border-border bg-card shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border px-5 py-4">
          <h2 className="text-[16px] font-bold text-[#646373]">Edit Favorites</h2>
          <button
            type="button"
            onClick={onClose}
            className="flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground"
          >
            <X size={16} />
          </button>
        </div>

        <div className="p-5 space-y-4">
          {/* Selected favorites */}
          <div>
            <p className="mb-2 text-right text-[12px] font-medium text-muted-foreground">
              {selected.length}/5 selected
            </p>
            <div className="flex gap-2">
              {selected.map((game) => (
                <div key={game.gameId} className="group/fav relative min-w-0 flex-1">
                  <div className="relative aspect-[3/4] w-full overflow-hidden rounded-lg bg-muted">
                    {game.coverUrl ? (
                      <Image src={game.coverUrl} alt="" fill className="object-cover" sizes="20vw" />
                    ) : (
                      <div className="flex h-full items-center justify-center text-[8px] text-muted-foreground">—</div>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => toggleGame(game)}
                    className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-[#656379] text-white opacity-0 shadow transition-opacity group-hover/fav:opacity-100"
                  >
                    <X size={10} weight="bold" />
                  </button>
                  <p className="mt-1 line-clamp-1 text-[10px] font-medium leading-tight text-[#646373]">
                    {game.title}
                  </p>
                </div>
              ))}
              {Array.from({ length: Math.max(0, 5 - selected.length) }).map((_, i) => (
                <div
                  key={`slot-${i}`}
                  className="flex aspect-[3/4] min-w-0 flex-1 items-center justify-center rounded-lg border border-dashed border-border bg-muted/20"
                >
                  <Plus size={14} className="text-muted-foreground/40" />
                </div>
              ))}
            </div>
          </div>

          {/* Search */}
          <div className="relative">
            <MagnifyingGlass size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              type="search"
              placeholder="Search your library..."
              className="h-10 w-full rounded-lg border-0 bg-muted/50 pl-9 pr-3 text-[13px] placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-[#656379]/30"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          {/* Library list */}
          <div className="max-h-[240px] overflow-y-auto">
            <ul className="py-1">
              {filtered.map((game) => {
                const isSelected = selected.some((s) => s.gameId === game.gameId);
                const atLimit = !isSelected && selected.length >= 5;
                return (
                  <li
                    key={game.gameId}
                    className={`flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2 transition-colors hover:bg-muted/50 ${
                      atLimit ? "pointer-events-none opacity-40" : ""
                    }`}
                    onClick={() => !atLimit && toggleGame(game)}
                  >
                    <div className="relative h-14 w-10 shrink-0 overflow-hidden rounded-md bg-muted">
                      {game.coverUrl ? (
                        <Image src={game.coverUrl} alt="" fill className="object-cover" sizes="40px" />
                      ) : (
                        <div className="flex h-full items-center justify-center text-[9px] text-muted-foreground">—</div>
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[14px] font-semibold text-[#646373]">{game.title}</p>
                      {game.developerName && (
                        <p className="truncate text-[12px] text-muted-foreground">{game.developerName}</p>
                      )}
                    </div>
                    <div className="flex shrink-0 items-center">
                      {isSelected ? (
                        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#D4D3DF] text-[#646373]">
                          <Check size={16} weight="bold" />
                        </span>
                      ) : (
                        <span className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground transition-all hover:bg-[#D4D3DF] hover:text-[#646373]">
                          <Plus size={16} weight="bold" />
                        </span>
                      )}
                    </div>
                  </li>
                );
              })}
              {filtered.length === 0 && (
                <p className="py-6 text-center text-[13px] text-muted-foreground">
                  No games match your search.
                </p>
              )}
            </ul>
          </div>

          {/* Save */}
          <button
            type="button"
            onClick={() => void save()}
            disabled={saving}
            className="flex h-10 w-full items-center justify-center gap-2 rounded-lg bg-[#656379] font-mono text-[13px] font-semibold uppercase text-white hover:opacity-90 disabled:opacity-50"
          >
            {saving ? (
              <SpinnerGap size={16} className="animate-spin" />
            ) : null}
            {saving ? "Saving..." : "Save Favorites"}
          </button>
        </div>
      </div>
    </div>
  );
}
