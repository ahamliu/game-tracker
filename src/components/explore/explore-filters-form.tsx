"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { ExploreSort } from "@/lib/explore";

export function ExploreFiltersForm({
  initialQ,
  initialSort,
  initialGenreIds,
  genres,
}: {
  initialQ: string;
  initialSort: ExploreSort;
  initialGenreIds: number[];
  genres: { id: number; name: string }[];
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const q = (fd.get("q") as string) ?? "";
    const sort = (fd.get("sort") as string) ?? "popular";
    const checked = fd.getAll("genre").map((v) => String(v));
    const params = new URLSearchParams();
    if (q.trim()) params.set("q", q.trim());
    if (sort && sort !== "popular") params.set("sort", sort);
    if (checked.length) params.set("genres", checked.join(","));
    const s = params.toString();
    startTransition(() => {
      router.push(s ? `/?${s}` : "/");
    });
  }

  return (
    <form onSubmit={submit} className="space-y-4 rounded-xl border border-border bg-card p-4">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end">
        <div className="min-w-0 flex-1 space-y-2">
          <Label htmlFor="explore-q">Search</Label>
          <Input
            id="explore-q"
            name="q"
            placeholder="Search games by title…"
            defaultValue={initialQ}
            autoComplete="off"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="explore-sort">Sort</Label>
          <select
            id="explore-sort"
            name="sort"
            defaultValue={initialSort}
            className="flex h-10 w-full min-w-[180px] rounded-md border border-border bg-background px-3 text-sm"
          >
            <option value="popular">Most saved</option>
            <option value="rated">Highest rated</option>
            <option value="newest">Newest</option>
          </select>
        </div>
        <Button type="submit" disabled={pending}>
          {pending ? "Applying…" : "Apply"}
        </Button>
      </div>
      {genres.length > 0 && (
        <fieldset>
          <legend className="mb-2 text-sm font-medium">Genres</legend>
          <div className="flex flex-wrap gap-3">
            {genres.map((g) => (
              <label key={g.id} className="flex cursor-pointer items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  name="genre"
                  value={String(g.id)}
                  defaultChecked={initialGenreIds.includes(g.id)}
                  className="rounded border-border"
                />
                {g.name}
              </label>
            ))}
          </div>
        </fieldset>
      )}
    </form>
  );
}
