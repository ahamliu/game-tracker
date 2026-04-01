"use client";

import Image from "next/image";
import Link from "next/link";
import { useRef, useState, useCallback, useEffect } from "react";
import { CaretLeft, CaretRight } from "@phosphor-icons/react";
import type { CarouselEntry } from "@/lib/explore";
import { statusLabel, statusColor } from "@/lib/status";
import { StatusIcon } from "@/components/status-controls";
import { cn } from "@/lib/utils";

export function ExploreLibraryCarousel({ entries }: { entries: CarouselEntry[] }) {
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
    el.setPointerCapture(e.pointerId);
  }

  function handlePointerMove(e: React.PointerEvent) {
    if (!isDragging) return;
    const dx = e.clientX - dragState.current.startX;
    if (Math.abs(dx) > 3) dragState.current.moved = true;
    scrollRef.current!.scrollLeft = dragState.current.scrollLeft - dx;
  }

  function handlePointerUp(e: React.PointerEvent) {
    setIsDragging(false);
    scrollRef.current?.releasePointerCapture(e.pointerId);
  }

  if (entries.length === 0) {
    return (
      <div className="rounded-[10px] border border-dashed border-border px-6 py-10 text-center">
        <p className="text-[13px] text-muted-foreground">
          No games in your library yet. Use the search bar to add your first game.
        </p>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-[16px] font-bold text-[#646373]">My Library</h2>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => scroll("left")}
            disabled={!canScrollLeft}
            className="flex h-7 w-7 items-center justify-center rounded-md text-[#646373] hover:bg-[#E8E8E8] disabled:pointer-events-none disabled:text-muted-foreground/30 dark:hover:bg-[#2a2a35]"
          >
            <CaretLeft size={14} weight="bold" />
          </button>
          <button
            type="button"
            onClick={() => scroll("right")}
            disabled={!canScrollRight}
            className="flex h-7 w-7 items-center justify-center rounded-md text-[#646373] hover:bg-[#E8E8E8] disabled:pointer-events-none disabled:text-muted-foreground/30 dark:hover:bg-[#2a2a35]"
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
        className="flex gap-4 overflow-x-auto scrollbar-none"
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
            className="group/card shrink-0"
            style={{ width: "calc((100% - 4 * 1rem) / 5)" }}
            onClick={(ev) => { if (dragState.current.moved) ev.preventDefault(); }}
            draggable={false}
          >
            <div className="relative z-10 mb-[-12px] flex justify-center">
              <span
                className={cn(
                  "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 font-mono text-[9px] font-bold shadow-sm",
                  statusColor(e.status),
                )}
              >
                <StatusIcon status={e.status} />
                {statusLabel(e.status).toUpperCase()}
              </span>
            </div>
            <div className="relative aspect-[2/3] w-full overflow-hidden rounded-[10px] bg-muted">
              {e.coverUrl ? (
                <Image src={e.coverUrl} alt="" fill className="pointer-events-none object-cover" sizes="140px" draggable={false} />
              ) : (
                <div className="flex h-full items-center justify-center text-[10px] text-muted-foreground">No cover</div>
              )}
              <div className="absolute inset-0 rounded-[10px] transition-[backdrop-filter] duration-200 group-hover/card:backdrop-saturate-[1.4] group-hover/card:backdrop-contrast-[1.05]" />
            </div>
            <p className="mt-1 line-clamp-2 text-center text-[14px] font-semibold leading-tight text-[#646373]">{e.title}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
