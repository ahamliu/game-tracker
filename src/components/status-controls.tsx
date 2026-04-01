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
import { ConfirmDialog } from "@/components/confirm-dialog";
import { showSnackbar } from "@/components/snackbar";
import type { EntryStatus } from "@/lib/status";
import { statusLabel, statusColor, STATUS_OPTIONS } from "@/lib/status";
import { cn } from "@/lib/utils";

export function RatingDropdown({ entryId, rating, compact }: { entryId: string; rating: number | null; compact?: boolean }) {
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
        {compact
          ? (optimistic != null ? optimistic : "-")
          : <>Rating: {optimistic != null ? `${optimistic}/10` : "-/-"}</>}
        <CaretDown size={12} />
      </button>
      {open && (
        <div className="absolute right-0 top-full z-50 mt-1 w-24 rounded-lg border border-border bg-card px-2 py-1.5">
          <button
            type="button"
            className={cn(
              "mb-1 block w-full rounded py-1 text-center text-[14px] text-app-muted",
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
                  "rounded py-1 text-center text-[14px] text-app-muted",
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

export function StatusDropdown({ entryId, status, gameTitle, showRemove = true, compact, onRemove }: { entryId: string; status: EntryStatus; gameTitle?: string; showRemove?: boolean; compact?: boolean; onRemove?: () => void }) {
  const router = useRouter();
  const [optimistic, setOptimistic] = useState(status);
  const [open, setOpen] = useState(false);
  const [confirmRemove, setConfirmRemove] = useState(false);
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
    setConfirmRemove(false);
    setOpen(false);
    await fetch(`/api/me/library/${entryId}`, { method: "DELETE" });
    showSnackbar(`${gameTitle ?? "Game"} removed from library`);
    if (onRemove) {
      onRemove();
    } else {
      router.refresh();
    }
  }, [entryId, gameTitle, router, onRemove]);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        className={cn(
          "inline-flex cursor-pointer items-center rounded-full font-mono font-bold shadow-sm",
          compact ? "gap-1 px-2.5 py-0.5 text-[9px]" : "gap-1.5 px-3 py-1 text-[11px]",
          statusColor(optimistic)
        )}
        onClick={(e) => { e.preventDefault(); setOpen((v) => !v); }}
      >
        <StatusIcon status={optimistic} size={compact ? 10 : 12} />
        {statusLabel(optimistic).toUpperCase()}
        <CaretDown size={compact ? 8 : 10} />
      </button>
      {open && (
        <div className="absolute right-0 top-full z-50 mt-1 w-36 rounded-lg border border-border bg-card py-1">
          {STATUS_OPTIONS.map((o) => (
            <button
              key={o.value}
              type="button"
              className={cn(
                "flex w-full items-center gap-2 px-3 py-1.5 text-left text-[14px] text-app-muted",
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
                className="flex w-full items-center gap-2 px-3 py-1.5 text-left text-[14px] text-[#822B34] hover:bg-muted"
                onClick={(e) => { e.preventDefault(); setOpen(false); setConfirmRemove(true); }}
              >
                <X size={14} weight="bold" />
                Remove
              </button>
            </>
          )}
        </div>
      )}
      <ConfirmDialog
        open={confirmRemove}
        title="Remove from library"
        description="This game and all its routes will be permanently removed from your library."
        confirmLabel="Remove"
        onConfirm={() => void removeEntry()}
        onCancel={() => setConfirmRemove(false)}
      />
    </div>
  );
}

export function StatusIcon({ status, size = 12 }: { status: EntryStatus; size?: number }) {
  switch (status) {
    case "playing":
      return <GameController size={size} weight="fill" />;
    case "completed":
      return <Check size={size} weight="bold" />;
    case "planning":
      return <BookmarkSimple size={size} weight="fill" />;
    case "dropped":
      return <Trash size={size} weight="fill" />;
    case "on_hold":
      return <BookmarkSimple size={size} weight="fill" />;
    default:
      return null;
  }
}
