"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  Heart,
  Plus,
  X,
  PencilSimple,
  DotsSixVertical,
  SpinnerGap,
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
              className="flex h-[160px] w-[110px] shrink-0 items-center justify-center rounded-[10px] border border-dashed border-border bg-muted/30 transition-colors hover:border-[#646373] hover:bg-muted/50"
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
      href="#"
      className="group w-[110px] shrink-0"
    >
      <div className="relative h-[150px] w-[110px] overflow-hidden rounded-[10px] bg-muted transition-all group-hover:shadow-[0_1px_1px_0_rgba(0,0,0,0.25)]">
        {game.coverUrl ? (
          <Image src={game.coverUrl} alt="" fill className="object-cover" sizes="110px" />
        ) : (
          <div className="flex h-full items-center justify-center text-[10px] text-muted-foreground">
            No cover
          </div>
        )}
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

  const moveUp = useCallback((idx: number) => {
    if (idx === 0) return;
    setSelected((prev) => {
      const next = [...prev];
      [next[idx - 1], next[idx]] = [next[idx], next[idx - 1]];
      return next;
    });
  }, []);

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
      className="fixed inset-0 z-50 flex items-start justify-center bg-black/40 pt-[10vh] backdrop-blur-sm"
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
          {/* Current selection */}
          <div>
            <p className="mb-2 text-[12px] font-medium text-muted-foreground">
              Selected ({selected.length}/5)
            </p>
            {selected.length === 0 ? (
              <p className="text-[12px] text-muted-foreground/60">
                Select up to 5 games from your library below.
              </p>
            ) : (
              <div className="space-y-1">
                {selected.map((game, idx) => (
                  <div
                    key={game.gameId}
                    className="flex items-center gap-2 rounded-lg bg-muted/50 px-2 py-1.5"
                  >
                    <div className="flex flex-col">
                      <button
                        type="button"
                        onClick={() => moveUp(idx)}
                        className="text-muted-foreground hover:text-foreground disabled:opacity-30"
                        disabled={idx === 0}
                      >
                        <DotsSixVertical size={14} />
                      </button>
                    </div>
                    <div className="relative h-10 w-7 shrink-0 overflow-hidden rounded bg-muted">
                      {game.coverUrl ? (
                        <Image
                          src={game.coverUrl}
                          alt=""
                          fill
                          className="object-cover"
                          sizes="28px"
                        />
                      ) : (
                        <div className="flex h-full items-center justify-center text-[7px] text-muted-foreground">
                          —
                        </div>
                      )}
                    </div>
                    <span className="min-w-0 flex-1 truncate text-[13px] font-medium text-foreground">
                      {game.title}
                    </span>
                    <button
                      type="button"
                      onClick={() => toggleGame(game)}
                      className="flex h-6 w-6 shrink-0 items-center justify-center rounded text-muted-foreground hover:bg-destructive/10 hover:text-[#822B34]"
                    >
                      <X size={12} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Search + library list */}
          <div>
            <input
              type="search"
              placeholder="Filter library..."
              className="mb-2 h-9 w-full rounded-lg border-0 bg-muted/50 px-3 text-[13px] placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-[#656379]/30"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <div className="max-h-[220px] overflow-y-auto space-y-0.5">
              {filtered.map((game) => {
                const isSelected = selected.some((s) => s.gameId === game.gameId);
                return (
                  <button
                    key={game.gameId}
                    type="button"
                    className={`flex w-full items-center gap-3 rounded-lg px-2 py-2 text-left transition-colors hover:bg-muted ${
                      isSelected ? "bg-muted/70" : ""
                    } ${!isSelected && selected.length >= 5 ? "opacity-40" : ""}`}
                    onClick={() => toggleGame(game)}
                    disabled={!isSelected && selected.length >= 5}
                  >
                    <div className="relative h-12 w-9 shrink-0 overflow-hidden rounded bg-muted">
                      {game.coverUrl ? (
                        <Image
                          src={game.coverUrl}
                          alt=""
                          fill
                          className="object-cover"
                          sizes="36px"
                        />
                      ) : (
                        <div className="flex h-full items-center justify-center text-[8px] text-muted-foreground">
                          —
                        </div>
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[13px] font-medium text-foreground">
                        {game.title}
                      </p>
                      {game.developerName && (
                        <p className="truncate text-[10px] font-medium uppercase text-muted-foreground">
                          {game.developerName}
                        </p>
                      )}
                    </div>
                    {isSelected && (
                      <span className="shrink-0 rounded-full bg-[#656379] px-2 py-0.5 text-[10px] font-bold text-white">
                        {selected.findIndex((s) => s.gameId === game.gameId) + 1}
                      </span>
                    )}
                  </button>
                );
              })}
              {filtered.length === 0 && (
                <p className="py-4 text-center text-[12px] text-muted-foreground">
                  No games match your filter.
                </p>
              )}
            </div>
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
