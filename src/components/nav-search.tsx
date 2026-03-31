"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useCallback, useRef, useState } from "react";
import { MagnifyingGlass, X } from "@phosphor-icons/react";
import { Input } from "@/components/ui/input";
import type { EntryStatus } from "@/lib/status";

type SearchHit = {
  kind: "igdb" | "local";
  id: string;
  igdbId?: number;
  title: string;
  coverUrl?: string | null;
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

export function NavSearch() {
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
        <div className="absolute left-0 right-0 top-full z-50 mt-1 max-h-[400px] overflow-y-auto rounded-lg border border-border bg-card">
          {loading && (
            <p className="px-3 py-2 text-sm text-muted-foreground">Searching…</p>
          )}
          {error && (
            <p className="px-3 py-2 text-sm text-destructive">{error}</p>
          )}
          {!loading && results.length === 0 && q.length >= 2 && (
            <p className="px-3 py-2 text-sm text-muted-foreground">No results found.</p>
          )}
          {results.length > 0 && (
            <ul>
              {results.map((r) => (
                <li key={r.id}>
                  <button
                    type="button"
                    className="flex w-full items-center gap-3 px-3 py-2 text-left transition-colors hover:bg-accent"
                    onClick={() => addGame(r)}
                    disabled={loading}
                  >
                    <div className="relative h-12 w-8 shrink-0 overflow-hidden rounded bg-muted">
                      {r.coverUrl ? (
                        <Image src={r.coverUrl} alt="" fill className="object-cover" />
                      ) : (
                        <div className="flex h-full items-center justify-center text-[9px] text-muted-foreground">—</div>
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{r.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {r.kind === "igdb" ? "IGDB" : "Your catalog"} · Click to add
                      </p>
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
