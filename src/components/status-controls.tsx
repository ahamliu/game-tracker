"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Star,
  CaretDown,
  GameController,
  Check,
  BookmarkSimple,
  Trash,
  X,
} from "@phosphor-icons/react";
import type { EntryStatus } from "@/lib/status";
import { statusLabel, statusColor, STATUS_OPTIONS } from "@/lib/status";
import { cn } from "@/lib/utils";

export function RatingDropdown({ entryId, rating }: { entryId: string; rating: number | null }) {
  const router = useRouter();
  const [optimistic, setOptimistic] = useState(rating);
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => { setOptimistic(rating); }, [rating]);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const updateRating = useCallback(async (value: number | null) => {
    setOptimistic(value);
    setOpen(false);
    fetch(`/api/me/library/${entryId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ rating: value }),
    }).then(() => router.refresh());
  }, [entryId, router]);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        className="flex items-center gap-1 text-[12px] font-medium text-muted-foreground"
        onClick={(e) => { e.preventDefault(); setOpen((v) => !v); }}
      >
        <Star size={14} weight="fill" />
        Rating: {optimistic != null ? `${optimistic}/10` : "-/-"}
        <CaretDown size={12} />
      </button>
      {open && (
        <div className="absolute right-0 top-full z-50 mt-2 w-24 rounded-lg border border-border bg-card py-2 px-2">
          <button
            type="button"
            className={cn(
              "mb-1 block w-full rounded py-1.5 text-center text-sm text-foreground",
              optimistic == null ? "bg-muted" : "hover:bg-muted"
            )}
            onClick={(e) => { e.preventDefault(); void updateRating(null); }}
          >
            -
          </button>
          <div className="grid grid-cols-2 gap-1">
            {Array.from({ length: 10 }, (_, i) => i + 1).map((v) => (
              <button
                key={v}
                type="button"
                className={cn(
                  "rounded py-1.5 text-center text-sm text-foreground",
                  optimistic === v ? "bg-muted" : "hover:bg-muted"
                )}
                onClick={(e) => { e.preventDefault(); void updateRating(v); }}
              >
                {v}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export function StatusDropdown({ entryId, status, showRemove = true }: { entryId: string; status: EntryStatus; showRemove?: boolean }) {
  const router = useRouter();
  const [optimistic, setOptimistic] = useState(status);
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => { setOptimistic(status); }, [status]);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const updateStatus = useCallback(async (value: EntryStatus) => {
    setOptimistic(value);
    setOpen(false);
    fetch(`/api/me/library/${entryId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: value }),
    }).then(() => router.refresh());
  }, [entryId, router]);

  const removeEntry = useCallback(async () => {
    setOpen(false);
    fetch(`/api/me/library/${entryId}`, { method: "DELETE" })
      .then(() => router.refresh());
  }, [entryId, router]);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        className={cn(
          "inline-flex cursor-pointer items-center gap-1.5 rounded-full px-3 py-1 font-mono text-[11px] font-bold",
          statusColor(optimistic)
        )}
        onClick={(e) => { e.preventDefault(); setOpen((v) => !v); }}
      >
        <StatusIcon status={optimistic} />
        {statusLabel(optimistic).toUpperCase()}
        <CaretDown size={10} />
      </button>
      {open && (
        <div className="absolute right-0 top-full z-50 mt-2 w-40 rounded-lg border border-border bg-card py-1">
          {STATUS_OPTIONS.map((o) => (
            <button
              key={o.value}
              type="button"
              className={cn(
                "flex w-full items-center gap-2 px-4 py-2 text-left text-sm text-foreground",
                optimistic === o.value ? "bg-muted" : "hover:bg-muted"
              )}
              onClick={(e) => { e.preventDefault(); void updateStatus(o.value); }}
            >
              <StatusIcon status={o.value} />
              {o.label}
            </button>
          ))}
          {showRemove && (
            <>
              <div className="my-1 border-t border-border" />
              <button
                type="button"
                className="flex w-full items-center gap-2 px-4 py-2 text-left text-sm text-[#822B34] hover:bg-muted"
                onClick={(e) => { e.preventDefault(); void removeEntry(); }}
              >
                <X size={14} weight="bold" />
                Remove
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}

export function StatusIcon({ status }: { status: EntryStatus }) {
  switch (status) {
    case "playing":
      return <GameController size={12} weight="fill" />;
    case "completed":
      return <Check size={12} weight="bold" />;
    case "planning":
      return <BookmarkSimple size={12} weight="fill" />;
    case "dropped":
      return <Trash size={12} weight="fill" />;
    case "on_hold":
      return <BookmarkSimple size={12} weight="fill" />;
    default:
      return null;
  }
}
