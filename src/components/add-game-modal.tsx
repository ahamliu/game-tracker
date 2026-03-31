"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  MagnifyingGlass,
  X,
  Plus,
  SpinnerGap,
  GameController,
  PencilSimpleLine,
} from "@phosphor-icons/react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

type SearchHit = {
  kind: "igdb" | "local";
  id: string;
  igdbId?: number;
  title: string;
  coverUrl?: string | null;
  developerName?: string | null;
};

export function AddGameModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const router = useRouter();
  const [view, setView] = useState<"search" | "manual">("search");
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchHit[]>([]);
  const [loading, setLoading] = useState(false);
  const [adding, setAdding] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [searched, setSearched] = useState(false);

  const [manualTitle, setManualTitle] = useState("");
  const [manualCover, setManualCover] = useState("");
  const [manualSubmitting, setManualSubmitting] = useState(false);

  const inputRef = useRef<HTMLInputElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (open) {
      setView("search");
      setQuery("");
      setResults([]);
      setError(null);
      setSearched(false);
      setManualTitle("");
      setManualCover("");
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  const search = useCallback(async (q: string) => {
    if (q.trim().length < 2) {
      setResults([]);
      setSearched(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/games/search?q=${encodeURIComponent(q)}`);
      if (!res.ok) { setResults([]); return; }
      const data = await res.json();
      setResults(data.results ?? []);
      setSearched(true);
    } catch {
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, []);

  function handleQueryChange(value: string) {
    setQuery(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => void search(value), 300);
  }

  async function addGame(hit: SearchHit) {
    setAdding(hit.id);
    setError(null);
    try {
      const body =
        hit.kind === "igdb" && hit.igdbId != null
          ? { igdbId: hit.igdbId, status: "planning" }
          : { gameId: hit.id, status: "planning" };

      const res = await fetch("/api/me/library", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();

      if (res.status === 409 && data.error?.entryId) {
        onClose();
        router.push(`/library/${data.error.entryId}`);
        return;
      }
      if (!res.ok) {
        setError(data.error?.message ?? "Failed to add game.");
        return;
      }
      if (data.entry?.id) {
        onClose();
        router.refresh();
        router.push(`/library/${data.entry.id}`);
      }
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setAdding(null);
    }
  }

  async function addManual() {
    if (!manualTitle.trim()) return;
    setManualSubmitting(true);
    setError(null);
    try {
      const body: Record<string, string> = {
        title: manualTitle.trim(),
        status: "planning",
      };
      if (manualCover.trim()) body.coverUrl = manualCover.trim();

      const res = await fetch("/api/me/library", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();

      if (res.status === 409 && data.error?.entryId) {
        onClose();
        router.push(`/library/${data.error.entryId}`);
        return;
      }
      if (!res.ok) {
        setError(data.error?.message ?? "Failed to add game.");
        return;
      }
      if (data.entry?.id) {
        onClose();
        router.refresh();
        router.push(`/library/${data.entry.id}`);
      }
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setManualSubmitting(false);
    }
  }

  if (!open) return null;

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-50 flex items-start justify-center bg-black/40 pt-[10vh] backdrop-blur-sm"
      onClick={(e) => { if (e.target === overlayRef.current) onClose(); }}
    >
      <div className="w-full max-w-[520px] overflow-hidden rounded-xl border border-border bg-card shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border px-5 py-4">
          <h2 className="text-[16px] font-bold text-[#646373]">Add Game</h2>
          <button
            type="button"
            onClick={onClose}
            className="flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground"
          >
            <X size={16} />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-border">
          <button
            type="button"
            className={cn(
              "flex flex-1 items-center justify-center gap-2 py-3 text-[13px] font-medium transition-colors",
              view === "search"
                ? "border-b-2 border-[#656379] text-[#646373]"
                : "text-muted-foreground hover:text-foreground"
            )}
            onClick={() => setView("search")}
          >
            <MagnifyingGlass size={16} />
            Search
          </button>
          <button
            type="button"
            className={cn(
              "flex flex-1 items-center justify-center gap-2 py-3 text-[13px] font-medium transition-colors",
              view === "manual"
                ? "border-b-2 border-[#656379] text-[#646373]"
                : "text-muted-foreground hover:text-foreground"
            )}
            onClick={() => setView("manual")}
          >
            <PencilSimpleLine size={16} />
            Add Manually
          </button>
        </div>

        {/* Body */}
        <div className="p-5">
          {view === "search" ? (
            <div className="space-y-3">
              <div className="relative">
                <MagnifyingGlass size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <Input
                  ref={inputRef}
                  type="search"
                  placeholder="Search by title..."
                  className="h-11 border-border bg-muted/50 pl-10 text-[14px] focus-visible:ring-[#656379]/30"
                  value={query}
                  onChange={(e) => handleQueryChange(e.target.value)}
                />
                {query && (
                  <button
                    type="button"
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    onClick={() => { setQuery(""); setResults([]); setSearched(false); inputRef.current?.focus(); }}
                  >
                    <X size={14} />
                  </button>
                )}
              </div>

              {/* Results */}
              <div className="max-h-[320px] overflow-y-auto">
                {loading && (
                  <div className="flex items-center justify-center py-8">
                    <SpinnerGap size={24} className="animate-spin text-muted-foreground" />
                  </div>
                )}

                {!loading && searched && results.length === 0 && (
                  <div className="py-8 text-center">
                    <GameController size={32} className="mx-auto mb-2 text-muted-foreground" />
                    <p className="text-[13px] text-muted-foreground">No games found for &ldquo;{query}&rdquo;</p>
                    <button
                      type="button"
                      className="mt-3 text-[13px] font-medium text-[#656379] hover:underline"
                      onClick={() => { setManualTitle(query); setView("manual"); }}
                    >
                      Add it manually instead
                    </button>
                  </div>
                )}

                {!loading && results.length > 0 && (
                  <ul className="space-y-1">
                    {results.map((r) => (
                      <li key={r.id}>
                        <button
                          type="button"
                          className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left transition-colors hover:bg-muted disabled:opacity-60"
                          onClick={() => void addGame(r)}
                          disabled={adding === r.id}
                        >
                          <div className="relative h-14 w-10 shrink-0 overflow-hidden rounded bg-muted">
                            {r.coverUrl ? (
                              <Image src={r.coverUrl} alt="" fill className="object-cover" sizes="40px" />
                            ) : (
                              <div className="flex h-full items-center justify-center text-[9px] text-muted-foreground">—</div>
                            )}
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-[14px] font-medium text-foreground">{r.title}</p>
                            {r.developerName && (
                              <p className="truncate text-[11px] font-medium uppercase text-muted-foreground">
                                {r.developerName}
                              </p>
                            )}
                          </div>
                          {adding === r.id ? (
                            <SpinnerGap size={16} className="shrink-0 animate-spin text-muted-foreground" />
                          ) : (
                            <Plus size={16} className="shrink-0 text-muted-foreground" />
                          )}
                        </button>
                      </li>
                    ))}
                  </ul>
                )}

                {!loading && !searched && query.length < 2 && (
                  <div className="py-8 text-center">
                    <MagnifyingGlass size={32} className="mx-auto mb-2 text-muted-foreground/50" />
                    <p className="text-[13px] text-muted-foreground">Type at least 2 characters to search</p>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-[13px] font-medium text-[#646373]">
                  Title <span className="text-[#822B34]">*</span>
                </label>
                <Input
                  placeholder="Game title"
                  className="h-11 border-border bg-muted/50 text-[14px] focus-visible:ring-[#656379]/30"
                  value={manualTitle}
                  onChange={(e) => setManualTitle(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter") void addManual(); }}
                  autoFocus={view === "manual"}
                />
              </div>
              <div className="space-y-2">
                <label className="text-[13px] font-medium text-[#646373]">
                  Cover Image URL <span className="text-[11px] font-normal text-muted-foreground">(optional)</span>
                </label>
                <Input
                  placeholder="https://..."
                  className="h-11 border-border bg-muted/50 text-[14px] focus-visible:ring-[#656379]/30"
                  value={manualCover}
                  onChange={(e) => setManualCover(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter") void addManual(); }}
                />
              </div>

              {manualCover && (
                <div className="flex items-center gap-3 rounded-lg bg-muted/50 p-3">
                  <div className="relative h-16 w-12 shrink-0 overflow-hidden rounded bg-muted">
                    <Image
                      src={manualCover}
                      alt="Preview"
                      fill
                      className="object-cover"
                      sizes="48px"
                      onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                    />
                  </div>
                  <p className="text-[12px] text-muted-foreground">Cover preview</p>
                </div>
              )}

              <button
                type="button"
                className="flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-[#656379] font-mono text-[13px] font-semibold uppercase tracking-wider text-white hover:opacity-90 disabled:opacity-50"
                onClick={() => void addManual()}
                disabled={!manualTitle.trim() || manualSubmitting}
              >
                {manualSubmitting ? (
                  <SpinnerGap size={16} className="animate-spin" />
                ) : (
                  <Plus size={14} weight="bold" />
                )}
                {manualSubmitting ? "Adding..." : "Add to Library"}
              </button>
            </div>
          )}

          {error && (
            <div className="mt-3 rounded-lg bg-destructive/10 px-3 py-2 text-[13px] text-[#822B34]">
              {error}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
