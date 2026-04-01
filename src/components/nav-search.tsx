"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useCallback, useRef, useState } from "react";
import { MagnifyingGlass, X, Plus } from "@phosphor-icons/react";
import { Input } from "@/components/ui/input";
import type { EntryStatus } from "@/lib/status";

type SearchHit = {
  kind: "igdb" | "local";
  id: string;
  igdbId?: number;
  title: string;
  coverUrl?: string | null;
  developerName?: string | null;
  inLibrary?: boolean;
};

async function readJsonBody(res: Response): Promise<unknown> {
  const text = await res.text();
  if (!text.trim()) return {};
  try {
    return JSON.parse(text) as unknown;
  } catch {
    return {};
  }
}

export function NavSearch({ signedIn = true }: { signedIn?: boolean }) {
  const router = useRouter();
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<SearchHit[]>([]);
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const search = useCallback(async (query: string) => {
    if (query.trim().length < 2) {
      setResults([]);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/games/search?q=${encodeURIComponent(query)}`);
      const data = (await readJsonBody(res)) as { results?: SearchHit[] };
      if (!res.ok) {
        setResults([]);
        return;
      }
      setResults(data.results ?? []);
    } catch {
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, []);

  async function addGame(hit: SearchHit, status: EntryStatus = "playing") {
    setLoading(true);
    setError(null);
    try {
      const body =
        hit.kind === "igdb" && hit.igdbId != null
          ? { igdbId: hit.igdbId, status }
          : { gameId: hit.id, status };

      const res = await fetch("/api/me/library", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = (await readJsonBody(res)) as {
        error?: { entryId?: string; code?: string };
        entry?: { id: string };
      };
      setLoading(false);
      if (res.status === 409 && data.error?.entryId) {
        setQ("");
        setResults([]);
        setOpen(false);
        router.push(`/library/${data.error.entryId}`);
        return;
      }
      if (!res.ok) {
        setError(data.error?.code === "NOT_FOUND" ? "Could not load from IGDB." : "Failed to add.");
        return;
      }
      if (data.entry?.id) {
        setQ("");
        setResults([]);
        setOpen(false);
        router.refresh();
        router.push(`/library/${data.entry.id}`);
      }
    } catch {
      setLoading(false);
      setError("Network error.");
    }
  }

  function viewGame(hit: SearchHit) {
    setQ("");
    setResults([]);
    setOpen(false);
    if (hit.kind === "local") {
      router.push(`/games/${hit.id}`);
    } else if (hit.igdbId != null) {
      router.push(`/games/igdb/${hit.igdbId}`);
    }
  }

  function handleBlur(e: React.FocusEvent) {
    if (!containerRef.current?.contains(e.relatedTarget as Node)) {
      setTimeout(() => setOpen(false), 150);
    }
  }

  return (
    <div ref={containerRef} className="relative w-full max-w-[520px]" onBlur={handleBlur}>
      <div className="flex items-center">
        <div className="relative flex flex-1 items-center h-[50px] rounded-xl bg-[hsl(var(--muted))] pl-4 pr-1.5">
          <MagnifyingGlass size={20} className="shrink-0 text-[#646373]" />
          <Input
            ref={inputRef}
            type="search"
            placeholder="Search games..."
            className="h-[38px] flex-1 border-0 bg-transparent pl-3 pr-8 text-[16px] shadow-none focus-visible:ring-0"
            value={q}
            onFocus={() => setOpen(true)}
            onChange={(e) => {
              const v = e.target.value;
              setQ(v);
              setOpen(true);
              void search(v);
            }}
          />
          {q && (
            <button
              type="button"
              className="mr-2 shrink-0 text-muted-foreground hover:text-foreground"
              onClick={() => {
                setQ("");
                setResults([]);
                inputRef.current?.focus();
              }}
            >
              <X size={16} />
            </button>
          )}
          <button
            type="button"
            className="h-[38px] shrink-0 rounded-lg bg-[#D4D3DF] px-4 font-mono text-[14px] font-semibold uppercase text-[#646373] hover:opacity-90"
            onClick={() => void search(q)}
          >
            Search
          </button>
        </div>
      </div>

      {open && (q.length >= 2 || results.length > 0) && (
        <div className="absolute left-0 right-0 top-full z-50 mt-1.5 max-h-[420px] overflow-y-auto rounded-xl border border-border bg-card shadow-lg">
          {loading && (
            <p className="px-4 py-3 text-[13px] text-muted-foreground">Searching…</p>
          )}
          {error && (
            <p className="px-4 py-3 text-[13px] text-destructive">{error}</p>
          )}
          {!loading && results.length === 0 && q.length >= 2 && (
            <p className="px-4 py-3 text-[13px] text-muted-foreground">No results found.</p>
          )}
          {results.length > 0 && (
            <ul className="py-1">
              {results.map((r) => (
                <li
                  key={r.id}
                  className="group/row flex items-center gap-3 px-3 py-2 transition-colors hover:bg-muted/50"
                >
                  <div className="relative h-14 w-10 shrink-0 overflow-hidden rounded-md bg-muted">
                    {r.coverUrl ? (
                      <Image src={r.coverUrl} alt="" fill className="object-cover" sizes="40px" />
                    ) : (
                      <div className="flex h-full items-center justify-center text-[9px] text-muted-foreground">—</div>
                    )}
                  </div>
                  <button
                    type="button"
                    className="min-w-0 flex-1 text-left"
                    onClick={() => viewGame(r)}
                  >
                    <p className="truncate text-[14px] font-semibold text-[#646373]">{r.title}</p>
                    {r.developerName && (
                      <p className="truncate text-[12px] text-muted-foreground">{r.developerName}</p>
                    )}
                  </button>
                  {signedIn && (
                    <div className="flex shrink-0 items-center gap-1">
                      {r.inLibrary ? (
                        <span className="px-2 text-[11px] font-medium text-muted-foreground">
                          Added
                        </span>
                      ) : (
                        <div className="group/add relative">
                          <button
                            type="button"
                            onClick={() => addGame(r)}
                            disabled={loading}
                            className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground transition-all hover:bg-[#D4D3DF] hover:text-[#646373] disabled:opacity-40"
                          >
                            <Plus size={16} weight="bold" />
                          </button>
                          <span className="pointer-events-none absolute -top-8 right-0 whitespace-nowrap rounded bg-[#333] px-2 py-1 text-[11px] text-white opacity-0 shadow transition-opacity group-hover/add:opacity-100 dark:bg-[#e5e5e5] dark:text-[#1a1a1a]">
                            Add to library
                          </span>
                        </div>
                      )}
                    </div>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
