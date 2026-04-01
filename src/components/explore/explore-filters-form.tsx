"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState, useTransition } from "react";
import { MagnifyingGlass, X, CaretDown } from "@phosphor-icons/react";
import { Input } from "@/components/ui/input";
import type { ExploreSort } from "@/lib/explore";

const SORT_OPTIONS: { value: ExploreSort; label: string }[] = [
  { value: "popular", label: "Most saved" },
  { value: "rated", label: "Highest rated" },
  { value: "newest", label: "Newest" },
];

export function ExploreFiltersForm({
  initialQ,
  initialSort,
  initialGenreIds,
  genres,
  total,
}: {
  initialQ: string;
  initialSort: ExploreSort;
  initialGenreIds: number[];
  genres: { id: number; name: string }[];
  total: number;
}) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [q, setQ] = useState(initialQ);
  const [sort, setSort] = useState<ExploreSort>(initialSort);
  const [sortOpen, setSortOpen] = useState(false);
  const [selectedGenres, setSelectedGenres] = useState<number[]>(initialGenreIds);
  const [genresOpen, setGenresOpen] = useState(false);
  const sortRef = useRef<HTMLDivElement>(null);
  const genresRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (sortRef.current && !sortRef.current.contains(e.target as Node)) setSortOpen(false);
      if (genresRef.current && !genresRef.current.contains(e.target as Node)) setGenresOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const navigate = useCallback(
    (search: string, sortVal: ExploreSort, genreIds: number[]) => {
      const params = new URLSearchParams();
      if (search.trim()) params.set("q", search.trim());
      if (sortVal !== "popular") params.set("sort", sortVal);
      if (genreIds.length) params.set("genres", genreIds.join(","));
      const s = params.toString();
      startTransition(() => {
        router.push(s ? `/?${s}` : "/", { scroll: false });
      });
    },
    [router]
  );

  function handleQueryChange(value: string) {
    setQ(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => navigate(value, sort, selectedGenres), 400);
  }

  function handleSortChange(value: ExploreSort) {
    setSort(value);
    setSortOpen(false);
    navigate(q, value, selectedGenres);
  }

  function handleGenreToggle(id: number) {
    const next = selectedGenres.includes(id)
      ? selectedGenres.filter((g) => g !== id)
      : [...selectedGenres, id];
    setSelectedGenres(next);
    navigate(q, sort, next);
  }

  return (
    <div className="space-y-2">
      {/* Search */}
      <div className="relative">
        <MagnifyingGlass
          size={20}
          className="absolute left-4 top-1/2 -translate-y-1/2 text-app-muted"
        />
        <Input
          type="search"
          placeholder="Search..."
          className="h-[50px] border-0 bg-card pl-12 text-[16px] shadow-none placeholder:text-muted-foreground focus-visible:ring-0"
          value={q}
          onChange={(e) => handleQueryChange(e.target.value)}
        />
        {q && (
          <button
            type="button"
            className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            onClick={() => { setQ(""); navigate("", sort, selectedGenres); }}
          >
            <X size={16} />
          </button>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-4 text-[14px] md:justify-between">
        <p className="font-normal text-muted-foreground">
          {total} {total === 1 ? "item" : "items"}
        </p>
        <div className="flex items-center gap-2">
          {/* Genre filter */}
          {genres.length > 0 && (
            <div ref={genresRef} className="relative">
              <button
                type="button"
                onClick={() => setGenresOpen(!genresOpen)}
                className="flex h-[36px] items-center gap-1.5 rounded-lg pl-0 pr-3 text-[14px] text-[#8B8B8B] md:min-w-[200px] md:max-w-[200px] md:pl-3"
              >
                <span className="shrink-0">Genre:</span>
                <span className="min-w-0 flex-1 truncate text-left">
                  {selectedGenres.length === 0
                    ? "Any"
                    : selectedGenres.length === 1
                      ? genres.find((g) => g.id === selectedGenres[0])?.name ?? "1 genre"
                      : `${selectedGenres.length} genres`}
                </span>
                <CaretDown size={12} className="ml-auto shrink-0" />
              </button>
              {genresOpen && (
                <div className="absolute right-0 top-full z-50 mt-1 max-h-[280px] w-48 overflow-y-auto rounded-lg border border-border bg-card py-1">
                  {selectedGenres.length > 0 && (
                    <button
                      type="button"
                      className="flex w-full items-center px-3 py-1.5 text-[14px] text-muted-foreground hover:bg-muted"
                      onClick={() => { setSelectedGenres([]); navigate(q, sort, []); }}
                    >
                      Clear all
                    </button>
                  )}
                  {genres.map((g) => {
                    const active = selectedGenres.includes(g.id);
                    return (
                      <button
                        key={g.id}
                        type="button"
                        className={`flex w-full items-start gap-2 px-3 py-1.5 text-left text-[14px] text-app-muted hover:bg-muted ${
                          active ? "bg-muted font-medium" : ""
                        }`}
                        onClick={() => handleGenreToggle(g.id)}
                      >
                        <span className={`mt-[1px] flex h-3.5 w-3.5 shrink-0 items-center justify-center rounded border text-[8px] ${
                          active ? "border-[#656379] bg-[#656379] text-white" : "border-border"
                        }`}>
                          {active && "✓"}
                        </span>
                        {g.name}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* Sort dropdown */}
          <div ref={sortRef} className="relative">
            <button
              type="button"
              onClick={() => setSortOpen(!sortOpen)}
              className="flex h-[36px] items-center gap-1.5 rounded-lg pl-0 pr-3 text-[14px] text-[#8B8B8B] md:w-[180px] md:pl-3"
            >
              <span className="shrink-0">Sort by:</span>
              <span className="min-w-0 flex-1 truncate text-left">{SORT_OPTIONS.find((o) => o.value === sort)?.label}</span>
              <CaretDown size={12} className="ml-auto shrink-0" />
            </button>
            {sortOpen && (
              <div className="absolute right-0 top-full z-50 mt-1 w-36 rounded-lg border border-border bg-card py-1">
                {SORT_OPTIONS.map((o) => (
                  <button
                    key={o.value}
                    type="button"
                    className={`flex w-full items-center px-3 py-1.5 text-[14px] text-app-muted hover:bg-muted ${
                      sort === o.value ? "bg-muted font-medium" : ""
                    }`}
                    onClick={() => handleSortChange(o.value)}
                  >
                    {o.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
