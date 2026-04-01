"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
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
  CaretLeft,
  CaretRight,
} from "@phosphor-icons/react";
import { Input } from "@/components/ui/input";
import { RatingDropdown, StatusDropdown } from "@/components/status-controls";
import { AddGameModal } from "@/components/add-game-modal";
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
  notes: string | null;
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

const PAGE_SIZE = 20;

export function LibraryContent({
  user,
  entries,
}: {
  user: UserData;
  entries: EntryData[];
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<EntryStatus | "all">("all");
  const [sort, setSort] = useState<SortOption>("recent");
  const [view, setView] = useState<"card" | "table">("card");
  const [statusOpen, setStatusOpen] = useState(false);
  const [sortOpen, setSortOpen] = useState(false);
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [manualTitle, setManualTitle] = useState("");
  const [page, setPage] = useState(1);
  const statusRef = useRef<HTMLDivElement>(null);
  const sortRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (searchParams.get("addGame") === "1") {
      setManualTitle(searchParams.get("title") ?? "");
      setAddModalOpen(true);
      router.replace("/library", { scroll: false });
    }
  }, [searchParams, router]);

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

  useEffect(() => {
    setPage(1);
  }, [search, statusFilter, sort]);

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

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const startIdx = (safePage - 1) * PAGE_SIZE;
  const paginated = filtered.slice(startIdx, startIdx + PAGE_SIZE);

  const joinDate = new Intl.DateTimeFormat("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  }).format(new Date(user.createdAt));

  return (
    <>
    <AddGameModal open={addModalOpen} onClose={() => { setAddModalOpen(false); setManualTitle(""); }} initialManualTitle={manualTitle || undefined} />
    <div className="mx-auto max-w-[1000px] space-y-6 py-2">
      {/* User header */}
      <div className="flex items-center justify-between">
        <Link href={`/u/${user.handle}`} className="flex items-center gap-3 md:gap-4">
          <div className="relative flex h-10 w-10 items-center justify-center rounded-full bg-[hsl(248,11%,43%)] text-white overflow-hidden md:h-16 md:w-16">
            {user.avatarUrl ? (
              <Image
                src={user.avatarUrl}
                alt=""
                fill
                unoptimized
                className="rounded-full object-cover"
              />
            ) : (
              <Ghost size={28} className="hidden md:block" />
            )}
            {!user.avatarUrl && <Ghost size={20} className="md:hidden" />}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-display text-[20px] leading-none text-[#646373] md:text-[28px]">
                {user.displayName}
              </h1>
              <span className="relative -top-[2px] hidden text-[14px] font-normal text-muted-foreground md:inline">
                @{user.handle}
              </span>
            </div>
            <p className="mt-0.5 text-[12px] font-normal text-muted-foreground md:text-[13px]">
              Joined {joinDate}
            </p>
          </div>
        </Link>
        <button
          type="button"
          onClick={() => setAddModalOpen(true)}
          className="flex h-9 items-center gap-1.5 rounded-lg bg-[#656379] px-4 font-mono text-[12px] font-semibold uppercase tracking-wider text-white hover:opacity-90 md:h-10 md:px-5 md:text-[14px]"
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
          <div className="hidden items-center gap-1 md:flex">
            <button
              type="button"
              onClick={() => setView("card")}
              className={cn(
                "flex h-9 w-9 items-center justify-center rounded-md text-[#646373]",
                view === "card" ? "bg-[#D4D3DF]" : "hover:bg-[#E8E8E8]",
              )}
            >
              <SquaresFour size={20} weight="fill" />
            </button>
            <button
              type="button"
              onClick={() => setView("table")}
              className={cn(
                "flex h-9 w-9 items-center justify-center rounded-md text-[#646373]",
                view === "table" ? "bg-[#D4D3DF]" : "hover:bg-[#E8E8E8]",
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
                <div className="absolute right-0 top-full z-50 mt-1 w-36 rounded-lg border border-border bg-card py-1">
                  {[
                    { value: "all" as const, label: "Any" },
                    ...STATUS_OPTIONS,
                  ].map((o) => (
                    <button
                      key={o.value}
                      type="button"
                      className={cn(
                        "block w-full px-3 py-1.5 text-left text-[12px] text-foreground",
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
                <div className="absolute right-0 top-full z-50 mt-1 w-36 rounded-lg border border-border bg-card py-1">
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
                        "block w-full px-3 py-1.5 text-left text-[12px] text-foreground",
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
      ) : (
        <>
          {/* Mobile card layout */}
          <ul className="space-y-3 md:hidden">
            {paginated.map((entry) => (
              <li key={entry.id}>
                <CardLink
                  href={`/library/${entry.id}`}
                  className="flex gap-3 rounded-[10px] bg-card p-3 cursor-pointer"
                >
                  <div className="relative h-[130px] w-[90px] shrink-0 overflow-hidden rounded-md bg-muted">
                    {entry.game.coverUrl ? (
                      <Image src={entry.game.coverUrl} alt="" fill className="object-cover" />
                    ) : (
                      <div className="flex h-full items-center justify-center text-xs text-muted-foreground">No art</div>
                    )}
                  </div>
                  <div className="flex min-w-0 flex-1 flex-col gap-1.5">
                    <h3 className="text-[14px] font-bold leading-snug text-[#646373] line-clamp-2">{entry.game.title}</h3>
                    <div className="flex items-center gap-1.5 text-[12px] text-muted-foreground" onClick={(e) => e.stopPropagation()}>
                      <span className="text-muted-foreground">Rating:</span>
                      <RatingDropdown entryId={entry.id} rating={entry.rating} compact />
                    </div>
                    <div className="flex items-center gap-1.5 text-[12px]" onClick={(e) => e.stopPropagation()}>
                      <span className="text-muted-foreground">Status:</span>
                      <StatusDropdown entryId={entry.id} status={entry.status} gameTitle={entry.game.title} compact />
                    </div>
                    <p className="text-[12px] text-muted-foreground">
                      <span>Updated:</span> {formatTimeAgo(entry.createdAt)}
                    </p>
                    <p className="text-[12px] text-muted-foreground">
                      <span>Added:</span> {formatTimeAgo(entry.createdAt)}
                    </p>
                  </div>
                </CardLink>
              </li>
            ))}
          </ul>

          {/* Desktop card layout */}
          {view === "card" ? (
            <ul className="hidden space-y-3 md:block">
              {paginated.map((entry) => (
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

                      {entry.notes && (
                        <p className="mt-1.5 line-clamp-2 text-[13px] leading-snug text-muted-foreground">
                          {entry.notes.length > 180
                            ? entry.notes.slice(0, 180) + "…"
                            : entry.notes}
                        </p>
                      )}

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
                                <span className="pointer-events-none absolute -top-8 left-1/2 -translate-x-1/2 whitespace-nowrap rounded bg-[#333] px-2 py-1 text-[11px] text-white opacity-0 shadow transition-opacity group-hover/route:opacity-100 dark:bg-[#e5e5e5] dark:text-[#1a1a1a]">
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
                        <StatusDropdown entryId={entry.id} status={entry.status} gameTitle={entry.game.title} />
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
            <div className="hidden space-y-1.5 md:block">
              <div className="flex items-center px-4 py-2 text-[13px] font-normal text-muted-foreground">
                <span className="flex-1">Title</span>
                <div className="flex w-[300px] shrink-0 items-center gap-4">
                  <span className="w-[60px] shrink-0">Rating</span>
                  <span className="w-[150px] shrink-0">Status</span>
                  <span className="flex-1">Added</span>
                </div>
              </div>
              {paginated.map((entry, i) => (
                <div
                  key={entry.id}
                  className={cn(
                    "flex cursor-pointer items-center rounded-lg px-[14px] py-[12px] text-[13px] transition-colors hover:bg-card dark:hover:bg-card",
                    i % 2 === 0 ? "bg-[#f9f9f9] dark:bg-card/40" : "bg-transparent",
                  )}
                  onClick={() => router.push(`/library/${entry.id}`)}
                >
                  <div className="flex min-w-0 flex-1 items-center gap-3">
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
                    <span className="truncate text-[14px] font-medium text-[#646373]">
                      {entry.game.title}
                    </span>
                  </div>
                  <div className="flex w-[300px] shrink-0 items-center gap-4">
                    <div
                      className="w-[60px] shrink-0"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <RatingDropdown entryId={entry.id} rating={entry.rating} compact />
                    </div>
                    <div
                      className="w-[150px] shrink-0"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <StatusDropdown entryId={entry.id} status={entry.status} gameTitle={entry.game.title} />
                    </div>
                    <span className="flex-1 font-mono text-[12px] text-muted-foreground">
                      {formatTimeAgo(entry.createdAt)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* Pagination */}
      {filtered.length > 0 && (
        <div className="flex flex-col items-center gap-3 pt-2">
          <p className="text-[13px] italic text-muted-foreground">
            Showing {startIdx + 1} to {Math.min(startIdx + PAGE_SIZE, filtered.length)} of {filtered.length} items
          </p>
          <nav className="flex items-center gap-1" aria-label="Pagination">
              <button
                type="button"
                disabled={safePage <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="flex h-9 w-9 items-center justify-center rounded-lg text-[#646373] hover:bg-[#E8E8E8] disabled:pointer-events-none disabled:text-muted-foreground/30 dark:hover:bg-[#2a2a35]"
              >
                <CaretLeft size={16} weight="bold" />
              </button>
              {pageNumbers(safePage, totalPages).map((p, i) =>
                p === "…" ? (
                  <span key={`ellipsis-${i}`} className="flex h-9 w-5 items-center justify-center text-[13px] text-muted-foreground">
                    …
                  </span>
                ) : (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setPage(p)}
                    className={cn(
                      "flex h-9 w-9 items-center justify-center rounded-lg text-[13px] font-medium",
                    p === safePage
                      ? "bg-[#D4D3DF] text-[#646373]"
                      : "text-[#646373] hover:bg-[#E8E8E8] dark:hover:bg-[#2a2a35]",
                    )}
                  >
                    {p}
                  </button>
                ),
              )}
              <button
                type="button"
                disabled={safePage >= totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                className="flex h-9 w-9 items-center justify-center rounded-lg text-[#646373] hover:bg-[#E8E8E8] disabled:pointer-events-none disabled:text-muted-foreground/30 dark:hover:bg-[#2a2a35]"
              >
                <CaretRight size={16} weight="bold" />
              </button>
          </nav>
        </div>
      )}
    </div>
    </>
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

function pageNumbers(current: number, total: number): (number | "…")[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  const pages: (number | "…")[] = [1];
  const left = Math.max(2, current - 1);
  const right = Math.min(total - 1, current + 1);
  if (left > 2) pages.push("…");
  for (let i = left; i <= right; i++) pages.push(i);
  if (right < total - 1) pages.push("…");
  pages.push(total);
  return pages;
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
