"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useMemo, useState, useRef, useEffect } from "react";
import {
  MagnifyingGlass,
  SquaresFour,
  ListBullets,
  Plus,
  BookmarkSimple,
  Ghost,
  SealCheck,
  CaretDown,
} from "@phosphor-icons/react";
import { Input } from "@/components/ui/input";
import { RatingDropdown, StatusDropdown } from "@/components/status-controls";
import type { EntryStatus } from "@/lib/status";
import { statusLabel, STATUS_OPTIONS } from "@/lib/status";
import { cn } from "@/lib/utils";

type RouteData = {
  id: string;
  name: string;
  imageUrl: string | null;
  status: EntryStatus;
};

type EntryData = {
  id: string;
  status: EntryStatus;
  rating: number | null;
  createdAt: Date;
  game: {
    id: string;
    title: string;
    coverUrl: string | null;
    developerName: string | null;
    releaseDate: Date | null;
    savedCount: number;
  };
  routes: RouteData[];
};

type UserData = {
  displayName: string;
  handle: string;
  avatarUrl: string | null;
  createdAt: Date;
};

type SortOption = "recent" | "title" | "rating";

export function LibraryContent({
  user,
  entries,
}: {
  user: UserData;
  entries: EntryData[];
}) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<EntryStatus | "all">("all");
  const [sort, setSort] = useState<SortOption>("recent");
  const [view, setView] = useState<"card" | "table">("card");
  const [statusOpen, setStatusOpen] = useState(false);
  const [sortOpen, setSortOpen] = useState(false);
  const statusRef = useRef<HTMLDivElement>(null);
  const sortRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (statusRef.current && !statusRef.current.contains(e.target as Node))
        setStatusOpen(false);
      if (sortRef.current && !sortRef.current.contains(e.target as Node))
        setSortOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const filtered = useMemo(() => {
    let result = entries;

    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter((e) => e.game.title.toLowerCase().includes(q));
    }

    if (statusFilter !== "all") {
      result = result.filter((e) => e.status === statusFilter);
    }

    result = [...result].sort((a, b) => {
      if (sort === "recent") {
        return (
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
      }
      if (sort === "title") {
        return a.game.title.localeCompare(b.game.title);
      }
      if (sort === "rating") {
        const ra = a.rating ?? -1;
        const rb = b.rating ?? -1;
        return rb - ra;
      }
      return 0;
    });

    return result;
  }, [entries, search, statusFilter, sort]);

  const joinDate = new Intl.DateTimeFormat("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  }).format(new Date(user.createdAt));

  return (
    <div className="mx-auto max-w-[860px] space-y-6 py-2">
      {/* User header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="relative flex h-16 w-16 items-center justify-center rounded-full bg-[hsl(248,11%,43%)] text-white overflow-hidden">
            {user.avatarUrl ? (
              <Image
                src={user.avatarUrl}
                alt=""
                fill
                unoptimized
                className="rounded-full object-cover"
              />
            ) : (
              <Ghost size={28} />
            )}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-display text-[28px] leading-none text-[#646373]">
                {user.displayName}
              </h1>
              <span className="relative -top-[2px] text-[14px] font-normal text-muted-foreground">
                @{user.handle}
              </span>
            </div>
            <p className="mt-0.5 text-[13px] font-normal text-muted-foreground">
              Joined {joinDate}
            </p>
          </div>
        </div>
        <button
          type="button"
          className="flex h-10 items-center gap-1.5 rounded-lg bg-[#656379] px-5 font-mono text-[14px] font-semibold uppercase tracking-wider text-white hover:opacity-90"
        >
          <Plus size={14} weight="bold" />
          Add Game
        </button>
      </div>

      {/* Search and filters bar */}
      <div className="space-y-3">
        <div className="flex items-center gap-3">
          <div className="relative flex-1">
            <MagnifyingGlass
              size={20}
              className="absolute left-4 top-1/2 -translate-y-1/2 text-[#646373]"
            />
            <Input
              type="search"
              placeholder="Search..."
              className="h-[50px] border-0 bg-card pl-12 text-[16px] shadow-none focus-visible:ring-0"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => setView("card")}
              className={cn(
                "flex h-9 w-9 items-center justify-center rounded-md text-[#646373]",
                view === "card" ? "bg-[#D7D7D7]" : "hover:bg-[#E8E8E8]",
              )}
            >
              <SquaresFour size={20} weight="fill" />
            </button>
            <button
              type="button"
              onClick={() => setView("table")}
              className={cn(
                "flex h-9 w-9 items-center justify-center rounded-md text-[#646373]",
                view === "table" ? "bg-[#D7D7D7]" : "hover:bg-[#E8E8E8]",
              )}
            >
              <ListBullets size={20} weight="bold" />
            </button>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-4 text-[14px]">
          <p className="font-normal text-muted-foreground">
            {filtered.length} items
          </p>
          <div className="flex items-center gap-4">
            <div ref={statusRef} className="relative flex items-center gap-1">
              <span className="font-normal text-muted-foreground">Status:</span>
              <button
                type="button"
                className="flex cursor-pointer items-center gap-1 font-normal text-[#8B8B8B]"
                onClick={() => {
                  setStatusOpen((v) => !v);
                  setSortOpen(false);
                }}
              >
                {statusFilter === "all" ? "Any" : statusLabel(statusFilter)}
                <CaretDown size={12} />
              </button>
              {statusOpen && (
                <div className="absolute right-0 top-full z-50 mt-2 w-40 rounded-lg border border-border bg-card py-1">
                  {[
                    { value: "all" as const, label: "Any" },
                    ...STATUS_OPTIONS,
                  ].map((o) => (
                    <button
                      key={o.value}
                      type="button"
                      className={cn(
                        "block w-full px-4 py-2 text-left text-sm text-foreground",
                        statusFilter === o.value
                          ? "bg-muted"
                          : "hover:bg-muted",
                      )}
                      onClick={() => {
                        setStatusFilter(o.value);
                        setStatusOpen(false);
                      }}
                    >
                      {o.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
            <div ref={sortRef} className="relative flex items-center gap-1">
              <span className="font-normal text-muted-foreground">
                Sort by:
              </span>
              <button
                type="button"
                className="flex cursor-pointer items-center gap-1 font-normal text-[#8B8B8B]"
                onClick={() => {
                  setSortOpen((v) => !v);
                  setStatusOpen(false);
                }}
              >
                {sort === "recent"
                  ? "Last added"
                  : sort === "title"
                    ? "Title"
                    : "Rating"}
                <CaretDown size={12} />
              </button>
              {sortOpen && (
                <div className="absolute right-0 top-full z-50 mt-2 w-40 rounded-lg border border-border bg-card py-1">
                  {(
                    [
                      { value: "recent" as const, label: "Last added" },
                      { value: "title" as const, label: "Title" },
                      { value: "rating" as const, label: "Rating" },
                    ] as const
                  ).map((o) => (
                    <button
                      key={o.value}
                      type="button"
                      className={cn(
                        "block w-full px-4 py-2 text-left text-sm text-foreground",
                        sort === o.value ? "bg-muted" : "hover:bg-muted",
                      )}
                      onClick={() => {
                        setSort(o.value);
                        setSortOpen(false);
                      }}
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

      {/* Entries */}
      {filtered.length === 0 ? (
        <div className="rounded-lg border border-dashed border-border p-12 text-center">
          <p className="text-muted-foreground">
            {entries.length === 0
              ? "No games yet. Use the search bar to add your first game."
              : "No games match your filters."}
          </p>
        </div>
      ) : view === "card" ? (
        <ul className="space-y-3">
          {filtered.map((entry) => (
            <li key={entry.id}>
              <CardLink
                href={`/library/${entry.id}`}
                className="flex min-h-[150px] gap-4 rounded-[10px] border border-transparent bg-card p-4 select-text transition-all hover:border-[#646373] hover:shadow-[0_1px_1px_0_rgba(0,0,0,0.25)] cursor-pointer"
              >
                <div className="relative h-[118px] w-[90px] shrink-0 overflow-hidden rounded-md bg-muted">
                  {entry.game.coverUrl ? (
                    <Image
                      src={entry.game.coverUrl}
                      alt=""
                      fill
                      className="object-cover"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center text-xs text-muted-foreground">
                      No art
                    </div>
                  )}
                </div>

                {/* Info */}
                <div className="flex min-w-0 flex-1 flex-col justify-between py-0.5">
                  <div>
                    <h3 className="text-[20px] font-bold leading-tight text-[#646373]">
                      {entry.game.title}
                    </h3>
                    <p className="mt-1 flex items-center gap-2 text-[12px] font-medium uppercase text-muted-foreground">
                      {entry.game.developerName && (
                        <span>{entry.game.developerName}</span>
                      )}
                      {entry.game.releaseDate && (
                        <>
                          {entry.game.developerName && <span>·</span>}
                          <span>
                            {new Date(entry.game.releaseDate).getFullYear()}
                          </span>
                        </>
                      )}
                      {entry.game.savedCount > 0 && (
                        <span className="inline-flex items-center gap-0.5">
                          <BookmarkSimple size={12} weight="fill" />
                          {entry.game.savedCount.toLocaleString()}
                        </span>
                      )}
                    </p>
                  </div>

                  {/* Routes */}
                  {entry.routes.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {sortedRoutes(entry.routes)
                        .slice(0, 8)
                        .map((r) => (
                          <div key={r.id} className="group/route relative">
                            <div
                              className={cn(
                                "relative h-[42px] w-[42px] overflow-hidden rounded-full border-2 bg-muted",
                                r.status === "completed"
                                  ? "border-success"
                                  : "border-[#646373] grayscale",
                              )}
                            >
                              {r.imageUrl ? (
                                <Image
                                  src={r.imageUrl}
                                  alt=""
                                  fill
                                  unoptimized
                                  className="object-cover"
                                />
                              ) : (
                                <div className="flex h-full items-center justify-center text-[10px] font-medium text-muted-foreground">
                                  {r.name.charAt(0).toUpperCase()}
                                </div>
                              )}
                            </div>
                            {r.status === "completed" && (
                              <span className="absolute -top-0.5 -right-0.5 flex h-[18px] w-[18px] items-center justify-center rounded-full bg-white">
                                <SealCheck
                                  size={18}
                                  weight="fill"
                                  className="text-success"
                                />
                              </span>
                            )}
                            <span className="pointer-events-none absolute -top-8 left-1/2 -translate-x-1/2 whitespace-nowrap rounded bg-foreground px-2 py-1 text-[11px] text-white opacity-0 transition-opacity group-hover/route:opacity-100">
                              {r.name}
                            </span>
                          </div>
                        ))}
                      {entry.routes.length > 8 && (
                        <span className="flex h-[42px] w-[42px] items-center justify-center rounded-full border border-dashed border-border text-xs text-muted-foreground">
                          +{entry.routes.length - 8}
                        </span>
                      )}
                    </div>
                  )}
                </div>

                {/* Right side: rating, status, actions */}
                <div className="flex shrink-0 flex-col items-end justify-between py-0.5">
                  <div className="flex items-center gap-4">
                    <RatingDropdown entryId={entry.id} rating={entry.rating} />
                    <StatusDropdown entryId={entry.id} status={entry.status} />
                  </div>
                  <p className="font-mono text-xs text-muted-foreground">
                    Added: {formatTimeAgo(entry.createdAt)}
                  </p>
                </div>
              </CardLink>
            </li>
          ))}
        </ul>
      ) : (
        <div className="rounded-lg bg-card">
          <table className="w-full text-left text-[13px]">
            <thead>
              <tr className="border-b border-border text-[12px] font-normal text-muted-foreground">
                <th className="py-2.5 pl-4 pr-2 font-normal">Title</th>
                <th className="px-2 py-2.5 font-normal">Rating</th>
                <th className="px-2 py-2.5 font-normal">Status</th>
                <th className="px-2 py-2.5 font-normal">Added</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((entry) => (
                <tr
                  key={entry.id}
                  className="cursor-pointer border-b border-border last:border-0 hover:bg-muted/50"
                  onClick={() => router.push(`/library/${entry.id}`)}
                >
                  <td className="py-3 pl-4 pr-2">
                    <div className="flex items-center gap-3">
                      <div className="relative h-10 w-8 shrink-0 overflow-hidden rounded bg-muted">
                        {entry.game.coverUrl ? (
                          <Image
                            src={entry.game.coverUrl}
                            alt=""
                            fill
                            className="object-cover"
                          />
                        ) : (
                          <div className="flex h-full items-center justify-center text-[8px] text-muted-foreground">
                            —
                          </div>
                        )}
                      </div>
                      <span className="truncate font-medium text-[#646373]">
                        {entry.game.title}
                      </span>
                    </div>
                  </td>
                  <td
                    className="px-2 py-3"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <RatingDropdown entryId={entry.id} rating={entry.rating} />
                  </td>
                  <td
                    className="px-2 py-3"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <StatusDropdown entryId={entry.id} status={entry.status} />
                  </td>
                  <td className="px-2 py-3 font-mono text-[12px] text-muted-foreground">
                    {formatTimeAgo(entry.createdAt)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function CardLink({
  href,
  className,
  children,
}: {
  href: string;
  className?: string;
  children: React.ReactNode;
}) {
  const router = useRouter();

  function handleClick(e: React.MouseEvent) {
    const target = e.target as HTMLElement;
    if (target.closest("button, [role='button'], a")) return;
    router.push(href);
  }

  return (
    <div className={className} onClick={handleClick}>
      {children}
    </div>
  );
}

function sortedRoutes(routes: RouteData[]): RouteData[] {
  return [...routes].sort((a, b) => {
    if (a.status === "completed" && b.status !== "completed") return -1;
    if (a.status !== "completed" && b.status === "completed") return 1;
    return 0;
  });
}

function formatTimeAgo(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - new Date(date).getTime();
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffHours < 1) return "just now";
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)}w ago`;
  return `${Math.floor(diffDays / 30)}mo ago`;
}
