"use client";

import { useEffect, useRef } from "react";
import { WarningCircle } from "@phosphor-icons/react";

export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel = "Remove",
  cancelLabel = "Cancel",
  variant = "destructive",
  onConfirm,
  onCancel,
}: {
  open: boolean;
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: "destructive" | "default";
  onConfirm: () => void;
  onCancel: () => void;
}) {
  const overlayRef = useRef<HTMLDivElement>(null);
  const confirmRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    confirmRef.current?.focus();
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onCancel();
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onCancel]);

  if (!open) return null;

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 backdrop-blur-sm"
      onClick={(e) => { if (e.target === overlayRef.current) onCancel(); }}
    >
      <div className="w-full max-w-[380px] rounded-xl border border-border bg-card p-6 shadow-xl">
        <div className="flex items-start gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#822B34]/10">
            <WarningCircle size={20} weight="fill" className="text-[#822B34]" />
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="text-[15px] font-bold text-[#646373]">{title}</h3>
            <p className="mt-1 text-[13px] leading-relaxed text-muted-foreground">{description}</p>
          </div>
        </div>

        <div className="mt-5 flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="rounded-lg px-4 py-2 text-[13px] font-medium text-muted-foreground hover:bg-muted"
          >
            {cancelLabel}
          </button>
          <button
            ref={confirmRef}
            type="button"
            onClick={onConfirm}
            className={
              variant === "destructive"
                ? "rounded-lg bg-[#822B34] px-4 py-2 text-[13px] font-semibold text-white hover:opacity-90"
                : "rounded-lg bg-[#656379] px-4 py-2 text-[13px] font-semibold text-white hover:opacity-90"
            }
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
