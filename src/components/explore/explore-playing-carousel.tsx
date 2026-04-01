"use client";

import Image from "next/image";
import Link from "next/link";
import { useRef, useState, useCallback, useEffect } from "react";
import { CaretLeft, CaretRight, SealCheck } from "@phosphor-icons/react";
import { cn } from "@/lib/utils";
import type { PlayingEntry } from "@/lib/explore";

export function ExplorePlayingCarousel({ entries }: { entries: PlayingEntry[] }) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const dragState = useRef({ startX: 0, scrollLeft: 0, moved: false });

  const updateScrollButtons = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 1);
    setCanScrollRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 1);
  }, []);

  useEffect(() => {
    updateScrollButtons();
    const el = scrollRef.current;
    if (!el) return;
    el.addEventListener("scroll", updateScrollButtons, { passive: true });
    const ro = new ResizeObserver(updateScrollButtons);
    ro.observe(el);
    return () => {
      el.removeEventListener("scroll", updateScrollButtons);
      ro.disconnect();
    };
  }, [updateScrollButtons]);

  function scroll(direction: "left" | "right") {
    const el = scrollRef.current;
    if (!el) return;
    const amount = el.clientWidth * 0.6;
    el.scrollBy({ left: direction === "left" ? -amount : amount, behavior: "smooth" });
  }

  function handlePointerDown(e: React.PointerEvent) {
    const el = scrollRef.current;
    if (!el) return;
    setIsDragging(true);
    dragState.current = { startX: e.clientX, scrollLeft: el.scrollLeft, moved: false };
  }

  function handlePointerMove(e: React.PointerEvent) {
    if (!isDragging) return;
    const dx = e.clientX - dragState.current.startX;
    if (Math.abs(dx) > 3) dragState.current.moved = true;
    scrollRef.current!.scrollLeft = dragState.current.scrollLeft - dx;
  }

  function handlePointerUp() {
    setIsDragging(false);
  }

  if (entries.length === 0) return null;

  return (
    <div className="min-w-0">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-[16px] font-bold text-app-muted">Currently Playing</h2>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => scroll("left")}
            disabled={!canScrollLeft}
            className="flex h-7 w-7 items-center justify-center rounded-md text-app-muted hover:bg-[#E8E8E8] disabled:pointer-events-none disabled:text-muted-foreground/30 dark:hover:bg-[#2a2a35]"
          >
            <CaretLeft size={14} weight="bold" />
          </button>
          <button
            type="button"
            onClick={() => scroll("right")}
            disabled={!canScrollRight}
            className="flex h-7 w-7 items-center justify-center rounded-md text-app-muted hover:bg-[#E8E8E8] disabled:pointer-events-none disabled:text-muted-foreground/30 dark:hover:bg-[#2a2a35]"
          >
            <CaretRight size={14} weight="bold" />
          </button>
          <Link
            href="/library"
            className="text-[12px] font-medium text-[#656379] hover:underline"
          >
            View all
          </Link>
        </div>
      </div>
      <div
        ref={scrollRef}
        className="flex gap-3 overflow-x-auto scrollbar-none"
        style={{ cursor: isDragging ? "grabbing" : "grab", scrollbarWidth: "none" }}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
      >
        {entries.map((e) => (
          <Link
            key={e.entryId}
            href={`/library/${e.entryId}`}
            className="group/card carousel-playing-card shrink-0"
            onClick={(ev) => { if (dragState.current.moved) ev.preventDefault(); }}
            draggable={false}
          >
            <article className="flex h-full gap-3 rounded-[10px] border border-transparent bg-card p-3 transition-all hover:border-app-muted hover:shadow-[0_1px_1px_0_rgba(0,0,0,0.25)]">
              <div className="relative h-28 w-[78px] shrink-0 overflow-hidden rounded-lg bg-muted">
                {e.coverUrl ? (
                  <Image src={e.coverUrl} alt="" fill className="pointer-events-none object-cover" sizes="78px" draggable={false} />
                ) : (
                  <div className="flex h-full items-center justify-center text-[9px] text-muted-foreground">No cover</div>
                )}
              </div>
              <div className="flex min-w-0 flex-1 flex-col">
                <h3 className="text-[16px] font-semibold leading-snug text-app-muted line-clamp-2">{e.title}</h3>
                {e.notes && (
                  <p className="mt-1 line-clamp-2 text-[11px] leading-snug text-muted-foreground">
                    {e.notes}
                  </p>
                )}
                {e.routes.length > 0 && (
                  <div className="mt-auto flex flex-wrap gap-1 pt-1.5">
                    {sortedRoutes(e.routes).slice(0, 3).map((r) => (
                      <div key={r.id} className="group/route relative">
                        <div
                          className={cn(
                            "relative h-[32px] w-[32px] overflow-hidden rounded-full border-2 bg-muted",
                            r.cleared
                              ? "border-success"
                              : "border-app-muted grayscale",
                          )}
                        >
                          {r.imageUrl ? (
                            <Image src={r.imageUrl} alt="" fill unoptimized className="object-cover" />
                          ) : (
                            <div className="flex h-full items-center justify-center text-[8px] font-medium text-muted-foreground">
                              {r.name.charAt(0).toUpperCase()}
                            </div>
                          )}
                        </div>
                        {r.cleared && (
                          <span className="absolute -top-0.5 -right-0.5 flex h-[14px] w-[14px] items-center justify-center rounded-full bg-white">
                            <SealCheck size={14} weight="fill" className="text-success" />
                          </span>
                        )}
                        <span className="pointer-events-none absolute -top-7 left-1/2 -translate-x-1/2 whitespace-nowrap rounded bg-[#333] px-2 py-0.5 text-[10px] text-white opacity-0 shadow transition-opacity group-hover/route:opacity-100 dark:bg-[#e5e5e5] dark:text-[#1a1a1a]">
                          {r.name}
                        </span>
                      </div>
                    ))}
                    {e.routes.length > 3 && (
                      <span className="flex h-[32px] w-[32px] items-center justify-center rounded-full border border-dashed border-border text-[10px] text-muted-foreground">
                        +{e.routes.length - 3}
                      </span>
                    )}
                  </div>
                )}
              </div>
            </article>
          </Link>
        ))}
      </div>
    </div>
  );
}

function sortedRoutes(routes: PlayingEntry["routes"]) {
  return [...routes].sort((a, b) => {
    if (a.cleared && !b.cleared) return -1;
    if (!a.cleared && b.cleared) return 1;
    return 0;
  });
}
