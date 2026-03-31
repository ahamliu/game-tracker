"use client";

import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState, useCallback, useRef } from "react";
import {
  Star,
  PencilSimple,
  Trash,
  ImageSquare,
  Plus,
  SealCheck,
  DotsThree,
  X,
  UploadSimple,
  NotePencil,
} from "@phosphor-icons/react";
import { StatusDropdown, StatusIcon } from "@/components/status-controls";
import { Input } from "@/components/ui/input";
import type { EntryStatus } from "@/lib/status";
import { statusLabel, STATUS_OPTIONS } from "@/lib/status";
import { cn } from "@/lib/utils";

type Game = {
  id: string;
  title: string;
  coverUrl: string | null;
  summary: string | null;
};

type RouteRow = {
  id: string;
  name: string;
  sortOrder: number;
  imageUrl: string | null;
  status: EntryStatus;
  rating: number | null;
  notes: string | null;
};

export function EntryDetail({
  entryId,
  initial,
}: {
  entryId: string;
  initial: {
    status: EntryStatus;
    rating: number | null;
    notes: string | null;
    progressPercent: number | null;
    progressNote: string | null;
    game: Game;
    routes: RouteRow[];
  };
}) {
  const router = useRouter();
  const [notes, setNotes] = useState(initial.notes ?? "");
  const [progressPercent, setProgressPercent] = useState(initial.progressPercent?.toString() ?? "");
  const [progressNote, setProgressNote] = useState(initial.progressNote ?? "");
  const [rating, setRating] = useState(initial.rating);
  const [routes, setRoutes] = useState(initial.routes);
  const [uploading, setUploading] = useState<string | null>(null);
  const [addingRoute, setAddingRoute] = useState(false);
  const [newRouteName, setNewRouteName] = useState("");
  const [overflowOpen, setOverflowOpen] = useState(false);
  const overflowRef = useRef<HTMLDivElement>(null);
  const [editingNotes, setEditingNotes] = useState(false);
  const [editingProgress, setEditingProgress] = useState(false);

  const patchEntry = useCallback(async (data: Record<string, unknown>) => {
    await fetch(`/api/me/library/${entryId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    router.refresh();
  }, [entryId, router]);

  function handleNotesBlur() {
    setEditingNotes(false);
    const val = notes.trim() || null;
    if (val !== initial.notes) {
      void patchEntry({ notes: val });
    }
  }

  function handleProgressBlur() {
    setEditingProgress(false);
    const pct = progressPercent === "" ? null : Number(progressPercent);
    const note = progressNote.trim() || null;
    if (pct !== initial.progressPercent || note !== initial.progressNote) {
      void patchEntry({ progressPercent: pct, progressNote: note });
    }
  }

  function handleRatingSelect(value: number | null) {
    setRating(value);
    void patchEntry({ rating: value });
  }

  async function removeFromLibrary() {
    if (!confirm("Remove this game from your library? Routes will be deleted.")) return;
    const res = await fetch(`/api/me/library/${entryId}`, { method: "DELETE" });
    if (res.ok) router.push("/library");
  }

  async function addRoute() {
    const name = newRouteName.trim();
    if (!name) return;
    const res = await fetch(`/api/me/library/${entryId}/routes`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, status: "planning" }),
    });
    const data = await res.json();
    if (res.ok && data.route) {
      setRoutes((r) => [...r, data.route]);
      setNewRouteName("");
      setAddingRoute(false);
      router.refresh();
    }
  }

  async function deleteRoute(routeId: string) {
    if (!confirm("Delete this route?")) return;
    const res = await fetch(`/api/me/library/${entryId}/routes/${routeId}`, { method: "DELETE" });
    if (res.ok) setRoutes((r) => r.filter((x) => x.id !== routeId));
  }

  async function uploadRouteImage(routeId: string, file: File | null) {
    if (!file) return;
    setUploading(routeId);
    const fd = new FormData();
    fd.append("file", file);
    const res = await fetch(`/api/me/library/${entryId}/routes/${routeId}/image`, {
      method: "POST",
      body: fd,
    });
    setUploading(null);
    const data = await res.json();
    if (res.ok && data.imageUrl) {
      setRoutes((r) => r.map((x) => (x.id === routeId ? { ...x, imageUrl: data.imageUrl } : x)));
    }
  }

  const completedCount = routes.filter((r) => r.status === "completed").length;
  const progressValue = progressPercent ? Number(progressPercent) : 0;

  return (
    <div className="mx-auto max-w-[860px] space-y-8 py-2">
      {/* Hero */}
      <div className="flex gap-6">
        <div className="relative h-[220px] w-[160px] shrink-0 overflow-hidden rounded-xl bg-muted shadow-md">
          {initial.game.coverUrl ? (
            <Image
              src={initial.game.coverUrl}
              alt=""
              fill
              className="object-cover"
            />
          ) : (
            <div className="flex h-full items-center justify-center p-4 text-center text-xs text-muted-foreground">
              No cover
            </div>
          )}
        </div>

        <div className="flex min-w-0 flex-1 flex-col justify-between">
          <div>
            <div className="flex items-start justify-between gap-4">
              <h1 className="text-[28px] font-bold leading-tight text-[#646373]">
                {initial.game.title}
              </h1>
              <div ref={overflowRef} className="relative shrink-0">
                <button
                  type="button"
                  onClick={() => setOverflowOpen((v) => !v)}
                  className="flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground hover:bg-[#E8E8E8] dark:hover:bg-[#2a2a35]"
                >
                  <DotsThree size={20} weight="bold" />
                </button>
                {overflowOpen && (
                  <div className="absolute right-0 top-full z-50 mt-1 w-48 rounded-lg border border-border bg-card py-1">
                    <button
                      type="button"
                      className="flex w-full items-center gap-2 px-4 py-2 text-left text-sm text-[#822B34] hover:bg-muted"
                      onClick={() => { setOverflowOpen(false); void removeFromLibrary(); }}
                    >
                      <Trash size={14} weight="bold" />
                      Remove from library
                    </button>
                  </div>
                )}
              </div>
            </div>

            {initial.game.summary && (
              <p className="mt-2 max-w-2xl text-[14px] leading-relaxed text-muted-foreground line-clamp-3">
                {initial.game.summary}
              </p>
            )}

            <div className="mt-4 flex flex-wrap items-center gap-3">
              <StatusDropdown entryId={entryId} status={initial.status} showRemove={false} />
              <InlineRating value={rating} onChange={handleRatingSelect} />
            </div>
          </div>

          {/* Progress bar */}
          <div className="mt-4">
            {editingProgress ? (
              <div className="flex items-center gap-3">
                <Input
                  type="number"
                  min={0}
                  max={100}
                  placeholder="0"
                  value={progressPercent}
                  onChange={(e) => setProgressPercent(e.target.value)}
                  onBlur={handleProgressBlur}
                  onKeyDown={(e) => { if (e.key === "Enter") handleProgressBlur(); }}
                  className="h-8 w-20 text-sm"
                  autoFocus
                />
                <span className="text-sm text-muted-foreground">%</span>
                <Input
                  placeholder="Chapter, label..."
                  value={progressNote}
                  onChange={(e) => setProgressNote(e.target.value)}
                  onBlur={handleProgressBlur}
                  onKeyDown={(e) => { if (e.key === "Enter") handleProgressBlur(); }}
                  className="h-8 flex-1 text-sm"
                />
              </div>
            ) : (
              <button
                type="button"
                className="group flex w-full items-center gap-3"
                onClick={() => setEditingProgress(true)}
              >
                <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full rounded-full bg-[#656379] transition-all"
                    style={{ width: `${Math.min(progressValue, 100)}%` }}
                  />
                </div>
                <span className="shrink-0 text-[12px] font-medium text-muted-foreground">
                  {progressPercent ? `${progressPercent}%` : "0%"}
                  {progressNote && ` · ${progressNote}`}
                </span>
                <PencilSimple size={14} className="shrink-0 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Notes */}
      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-[16px] font-bold text-[#646373]">Notes</h2>
          {!editingNotes && (
            <button
              type="button"
              onClick={() => setEditingNotes(true)}
              className="flex items-center gap-1 text-[12px] text-muted-foreground hover:text-foreground"
            >
              <PencilSimple size={14} />
              Edit
            </button>
          )}
        </div>
        {editingNotes ? (
          <textarea
            className="min-h-[120px] w-full rounded-lg border border-border bg-card px-4 py-3 text-[14px] leading-relaxed focus:outline-none focus:ring-2 focus:ring-[#656379]/30"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            onBlur={handleNotesBlur}
            autoFocus
            placeholder="Add notes about this game..."
          />
        ) : (
          <div
            className="min-h-[60px] cursor-pointer rounded-lg bg-card px-4 py-3 text-[14px] leading-relaxed text-muted-foreground transition-colors hover:bg-muted/50"
            onClick={() => setEditingNotes(true)}
          >
            {notes ? (
              <p className="whitespace-pre-wrap text-foreground">{notes}</p>
            ) : (
              <p className="italic">Click to add notes...</p>
            )}
          </div>
        )}
      </section>

      {/* Character Routes */}
      <section>
        <div className="mb-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h2 className="text-[16px] font-bold text-[#646373]">Character Routes</h2>
            {routes.length > 0 && (
              <span className="text-[12px] text-muted-foreground">
                {completedCount}/{routes.length} completed
              </span>
            )}
          </div>
          <button
            type="button"
            onClick={() => setAddingRoute(true)}
            className="flex items-center gap-1 text-[12px] font-semibold text-[#656379] hover:opacity-80"
          >
            <Plus size={14} weight="bold" />
            Add
          </button>
        </div>

        <div className="space-y-2">
          {routes.map((r) => (
            <RouteItem
              key={r.id}
              route={r}
              entryId={entryId}
              uploading={uploading === r.id}
              onUpload={(file) => uploadRouteImage(r.id, file)}
              onUpdate={(updated) => setRoutes((prev) => prev.map((x) => x.id === r.id ? { ...x, ...updated } : x))}
              onDelete={() => deleteRoute(r.id)}
            />
          ))}

          {addingRoute && (
            <div className="flex items-center gap-2 rounded-lg bg-card px-4 py-3">
              <Input
                value={newRouteName}
                onChange={(e) => setNewRouteName(e.target.value)}
                placeholder="Route name..."
                className="h-8 flex-1 border-0 bg-transparent p-0 text-[14px] shadow-none focus-visible:ring-0"
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === "Enter") void addRoute();
                  if (e.key === "Escape") { setAddingRoute(false); setNewRouteName(""); }
                }}
              />
              <button
                type="button"
                onClick={() => void addRoute()}
                disabled={!newRouteName.trim()}
                className="text-[12px] font-semibold text-[#656379] hover:opacity-80 disabled:opacity-40"
              >
                Add
              </button>
              <button
                type="button"
                onClick={() => { setAddingRoute(false); setNewRouteName(""); }}
                className="text-muted-foreground hover:text-foreground"
              >
                <X size={14} />
              </button>
            </div>
          )}

          {routes.length === 0 && !addingRoute && (
            <div
              className="cursor-pointer rounded-lg border border-dashed border-border bg-card/50 px-4 py-8 text-center transition-colors hover:bg-card"
              onClick={() => setAddingRoute(true)}
            >
              <p className="text-[13px] text-muted-foreground">
                No routes yet. Click to add your first character route.
              </p>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

function InlineRating({ value, onChange }: { value: number | null; onChange: (v: number | null) => void }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        className="flex items-center gap-1.5 rounded-lg px-2 py-1 text-[13px] font-medium text-muted-foreground hover:bg-muted"
        onClick={() => setOpen((v) => !v)}
        onBlur={(e) => {
          if (!ref.current?.contains(e.relatedTarget as Node)) setOpen(false);
        }}
      >
        <Star size={16} weight={value != null ? "fill" : "regular"} className={value != null ? "text-[#F5A623]" : ""} />
        {value != null ? `${value}/10` : "Rate"}
      </button>
      {open && (
        <div className="absolute left-0 top-full z-50 mt-1 flex items-center gap-1 rounded-lg border border-border bg-card px-2 py-1.5">
          <button
            type="button"
            className={cn(
              "flex h-7 w-7 items-center justify-center rounded text-[12px] text-foreground",
              value == null ? "bg-muted" : "hover:bg-muted"
            )}
            onClick={() => { onChange(null); setOpen(false); }}
          >
            —
          </button>
          {Array.from({ length: 10 }, (_, i) => i + 1).map((v) => (
            <button
              key={v}
              type="button"
              className={cn(
                "flex h-7 w-7 items-center justify-center rounded text-[12px] text-foreground",
                value === v ? "bg-muted font-bold" : "hover:bg-muted"
              )}
              onClick={() => { onChange(v); setOpen(false); }}
            >
              {v}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function RouteItem({
  route,
  entryId,
  uploading,
  onUpload,
  onUpdate,
  onDelete,
}: {
  route: RouteRow;
  entryId: string;
  uploading: boolean;
  onUpload: (file: File | null) => void;
  onUpdate: (updated: Partial<RouteRow>) => void;
  onDelete: () => void;
}) {
  const [editingName, setEditingName] = useState(false);
  const [name, setName] = useState(route.name);
  const [editingNotes, setEditingNotes] = useState(false);
  const [routeNotes, setRouteNotes] = useState(route.notes ?? "");
  const [hovered, setHovered] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const patchRoute = useCallback(async (data: Record<string, unknown>) => {
    const res = await fetch(`/api/me/library/${entryId}/routes/${route.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (res.ok) {
      const json = await res.json();
      if (json.route) onUpdate(json.route);
    }
  }, [entryId, route.id, onUpdate]);

  function handleNameSubmit() {
    const trimmed = name.trim();
    if (trimmed && trimmed !== route.name) {
      onUpdate({ name: trimmed });
      void patchRoute({ name: trimmed });
    } else {
      setName(route.name);
    }
    setEditingName(false);
  }

  function handleStatusChange(newStatus: EntryStatus) {
    onUpdate({ status: newStatus });
    void patchRoute({ status: newStatus });
  }

  function handleNotesBlur() {
    setEditingNotes(false);
    const val = routeNotes.trim() || null;
    if (val !== route.notes) {
      onUpdate({ notes: val });
      void patchRoute({ notes: val });
    }
  }

  async function removeImage() {
    onUpdate({ imageUrl: null });
    await patchRoute({ imageUrl: null });
  }

  return (
    <div
      className="group flex items-start gap-3 rounded-lg bg-card px-4 py-3 transition-colors hover:bg-card/80"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Avatar / image */}
      <div className="relative shrink-0">
        <div
          className={cn(
            "flex h-[48px] w-[48px] cursor-pointer items-center justify-center overflow-hidden rounded-full border-2 bg-muted transition-colors",
            route.status === "completed" ? "border-success" : "border-[#646373]"
          )}
          onClick={() => fileRef.current?.click()}
          title={route.imageUrl ? "Change image" : "Upload image"}
        >
          {route.imageUrl ? (
            <img src={route.imageUrl} alt="" className="h-full w-full object-cover" />
          ) : (
            <span className="text-[14px] font-medium text-muted-foreground">
              {route.name.charAt(0).toUpperCase()}
            </span>
          )}
          <div className="absolute inset-0 flex items-center justify-center rounded-full bg-black/40 opacity-0 transition-opacity hover:opacity-100">
            <UploadSimple size={16} className="text-white" />
          </div>
        </div>
        {route.status === "completed" && (
          <span className="absolute -right-0.5 -top-0.5 flex h-[18px] w-[18px] items-center justify-center rounded-full bg-white dark:bg-[hsl(240,5%,13%)]">
            <SealCheck size={18} weight="fill" className="text-success" />
          </span>
        )}
        <input
          ref={fileRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          className="hidden"
          disabled={uploading}
          onChange={(e) => onUpload(e.target.files?.[0] ?? null)}
        />
      </div>

      {/* Content */}
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          {editingName ? (
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              onBlur={handleNameSubmit}
              onKeyDown={(e) => { if (e.key === "Enter") handleNameSubmit(); if (e.key === "Escape") { setName(route.name); setEditingName(false); } }}
              className="h-6 border-0 bg-transparent p-0 text-[14px] font-medium text-foreground outline-none focus:ring-0"
              autoFocus
            />
          ) : (
            <button
              type="button"
              className="text-[14px] font-medium text-foreground hover:underline"
              onClick={() => setEditingName(true)}
            >
              {route.name}
            </button>
          )}

          <select
            className="rounded-md border border-border bg-transparent px-1.5 py-0.5 text-[11px] font-medium text-muted-foreground"
            value={route.status}
            onChange={(e) => handleStatusChange(e.target.value as EntryStatus)}
          >
            {STATUS_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>

          {route.rating != null && (
            <span className="flex items-center gap-0.5 text-[12px] text-muted-foreground">
              <Star size={12} weight="fill" className="text-[#F5A623]" />
              {route.rating}/10
            </span>
          )}
        </div>

        {/* Notes */}
        {editingNotes ? (
          <textarea
            className="mt-1 w-full resize-none rounded border border-border bg-transparent px-2 py-1 text-[13px] leading-relaxed text-foreground outline-none focus:ring-1 focus:ring-[#656379]/30"
            value={routeNotes}
            onChange={(e) => setRouteNotes(e.target.value)}
            onBlur={handleNotesBlur}
            onKeyDown={(e) => { if (e.key === "Escape") { setRouteNotes(route.notes ?? ""); setEditingNotes(false); } }}
            autoFocus
            rows={2}
            placeholder="Add notes..."
          />
        ) : route.notes ? (
          <p
            className="mt-1 cursor-pointer text-[13px] leading-relaxed text-muted-foreground hover:text-foreground"
            onClick={() => setEditingNotes(true)}
          >
            {route.notes}
          </p>
        ) : null}
      </div>

      {/* Actions (hover-reveal) */}
      <div className={cn(
        "flex shrink-0 items-center gap-1 transition-opacity",
        hovered ? "opacity-100" : "opacity-0"
      )}>
        {!route.notes && !editingNotes && (
          <button
            type="button"
            onClick={() => setEditingNotes(true)}
            className="flex h-7 w-7 items-center justify-center rounded text-muted-foreground hover:bg-muted hover:text-foreground"
            title="Add notes"
          >
            <NotePencil size={14} />
          </button>
        )}
        {route.imageUrl && (
          <button
            type="button"
            onClick={removeImage}
            className="flex h-7 w-7 items-center justify-center rounded text-muted-foreground hover:bg-muted hover:text-foreground"
            title="Remove image"
          >
            <ImageSquare size={14} />
          </button>
        )}
        <button
          type="button"
          onClick={onDelete}
          className="flex h-7 w-7 items-center justify-center rounded text-muted-foreground hover:bg-destructive/10 hover:text-[#822B34]"
          title="Delete route"
        >
          <Trash size={14} />
        </button>
      </div>
    </div>
  );
}
