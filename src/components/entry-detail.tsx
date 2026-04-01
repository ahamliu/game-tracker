"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState, useCallback, useRef } from "react";
import {
  Star,
  PencilSimple,
  Plus,
  X,
  CaretDown,
  BookmarkSimple,
} from "@phosphor-icons/react";
import { StatusDropdown, StatusIcon } from "@/components/status-controls";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { Input } from "@/components/ui/input";
import type { EntryStatus } from "@/lib/status";
import { statusLabel, statusColor, STATUS_OPTIONS } from "@/lib/status";
import { cn } from "@/lib/utils";

const NOTES_MAX = 5_000;
const ROUTE_NOTES_MAX = 5_000;

type Game = {
  id: string;
  title: string;
  coverUrl: string | null;
  summary: string | null;
  developerName: string | null;
  releaseDate: Date | null;
  savedCount: number;
  aggregatedRating: number | null;
  source: "igdb" | "user";
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
  const [rating, setRating] = useState(initial.rating);
  const [routes, setRoutes] = useState(initial.routes);
  const [addingRoute, setAddingRoute] = useState(false);
  const [newRouteName, setNewRouteName] = useState("");
  const [editingNotes, setEditingNotes] = useState(false);
  const [gameTitle, setGameTitle] = useState(initial.game.title);
  const [editingTitle, setEditingTitle] = useState(false);
  const [titleInput, setTitleInput] = useState(initial.game.title);
  const [coverUrl, setCoverUrl] = useState(initial.game.coverUrl);
  const [editingCover, setEditingCover] = useState(false);
  const [coverInput, setCoverInput] = useState("");
  const [coverError, setCoverError] = useState<string | null>(null);
  const [coverSaving, setCoverSaving] = useState(false);

  const patchEntry = useCallback(
    async (data: Record<string, unknown>) => {
      await fetch(`/api/me/library/${entryId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      router.refresh();
    },
    [entryId, router],
  );

  function handleNotesBlur() {
    setEditingNotes(false);
    const val = notes.trim() || null;
    if (val !== initial.notes) {
      void patchEntry({ notes: val });
    }
  }

  function handleRatingSelect(value: number | null) {
    setRating(value);
    void patchEntry({ rating: value });
  }

  async function saveTitle() {
    const trimmed = titleInput.trim();
    if (!trimmed || trimmed === gameTitle) {
      setTitleInput(gameTitle);
      setEditingTitle(false);
      return;
    }
    setGameTitle(trimmed);
    setEditingTitle(false);
    await fetch(`/api/games/${initial.game.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: trimmed }),
    });
    router.refresh();
  }

  async function saveCoverUrl() {
    const url = coverInput.trim() || null;
    if (url && !/^https?:\/\/.+\..+/.test(url)) {
      setCoverError("Please enter a valid URL");
      return;
    }
    setCoverSaving(true);
    setCoverError(null);
    try {
      const res = await fetch(`/api/games/${initial.game.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ coverUrl: url }),
      });
      if (res.ok) {
        setCoverUrl(url);
        setEditingCover(false);
        setCoverInput("");
        router.refresh();
      } else {
        setCoverError("Failed to update cover");
      }
    } catch {
      setCoverError("Network error");
    } finally {
      setCoverSaving(false);
    }
  }

  async function removeCover() {
    setCoverSaving(true);
    try {
      const res = await fetch(`/api/games/${initial.game.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ coverUrl: null }),
      });
      if (res.ok) {
        setCoverUrl(null);
        router.refresh();
      }
    } finally {
      setCoverSaving(false);
    }
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
    const res = await fetch(`/api/me/library/${entryId}/routes/${routeId}`, {
      method: "DELETE",
    });
    if (res.ok) setRoutes((r) => r.filter((x) => x.id !== routeId));
  }

  const completedCount = routes.filter((r) => r.status === "completed").length;
  const canEditCover = initial.game.source === "user" || !initial.game.coverUrl;

  return (
    <div className="mx-auto max-w-[860px] space-y-8 py-2">
      {/* Hero */}
      <div className="flex flex-col gap-5 sm:flex-row sm:gap-6">
        <div className="relative mx-auto w-[160px] shrink-0 sm:mx-0">
          <div className="group/cover relative h-[220px] w-[160px] overflow-hidden rounded-xl bg-muted shadow-md">
            {coverUrl ? (
              <Image
                src={coverUrl}
                alt=""
                fill
                className="object-cover"
              />
            ) : (
              <div className="flex h-full items-center justify-center p-4 text-center text-xs text-muted-foreground">
                No cover
              </div>
            )}
            {/* Hover overlay -- only for user-submitted games or IGDB games missing a cover */}
            {canEditCover && (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-black/50 opacity-0 transition-opacity group-hover/cover:opacity-100">
                <button
                  type="button"
                  onClick={() => {
                    setCoverInput(coverUrl ?? "");
                    setCoverError(null);
                    setEditingCover(true);
                  }}
                  className="flex items-center gap-1.5 rounded-lg bg-white/20 px-3 py-1.5 text-[11px] font-medium text-white hover:bg-white/30"
                >
                  <PencilSimple size={12} />
                  {coverUrl ? "Change" : "Add cover"}
                </button>
                {coverUrl && (
                  <button
                    type="button"
                    onClick={() => void removeCover()}
                    disabled={coverSaving}
                    className="flex items-center gap-1.5 rounded-lg bg-white/20 px-3 py-1.5 text-[11px] font-medium text-white hover:bg-red-400/60 disabled:opacity-50"
                  >
                    <X size={12} weight="bold" />
                    Remove
                  </button>
                )}
              </div>
            )}
          </div>

          {/* URL input popover -- outside overflow-hidden container */}
          {canEditCover && editingCover && (
            <div
              className="absolute left-1/2 top-full z-50 mt-2 w-[280px] -translate-x-1/2 rounded-lg border border-border bg-card p-3 shadow-xl sm:left-0 sm:translate-x-0"
              onClick={(e) => e.stopPropagation()}
            >
              <p className="mb-2 text-[12px] font-medium text-app-muted">Cover Image URL</p>
              <Input
                type="url"
                placeholder="https://..."
                value={coverInput}
                onChange={(e) => { setCoverInput(e.target.value); setCoverError(null); }}
                onKeyDown={(e) => {
                  if (e.key === "Enter") void saveCoverUrl();
                  if (e.key === "Escape") setEditingCover(false);
                }}
                className="h-9 text-[13px]"
                autoFocus
              />
              {coverInput && /^https?:\/\/.+\..+/.test(coverInput.trim()) && (
                <div className="mt-2 flex items-center gap-2 rounded bg-muted/50 p-2">
                  <div className="relative h-10 w-7 shrink-0 overflow-hidden rounded bg-muted">
                    { }
                    <img
                      src={coverInput.trim()}
                      alt="Preview"
                      className="h-full w-full object-cover"
                      onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                    />
                  </div>
                  <span className="text-[10px] text-muted-foreground">Preview</span>
                </div>
              )}
              {coverError && (
                <p className="mt-1 text-[11px] text-[#822B34]">{coverError}</p>
              )}
              <div className="mt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEditingCover(false)}
                  className="rounded px-2 py-1 text-[11px] text-muted-foreground hover:bg-muted"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => void saveCoverUrl()}
                  disabled={coverSaving}
                  className="rounded bg-[#656379] px-3 py-1 text-[11px] font-semibold text-white hover:opacity-90 disabled:opacity-50"
                >
                  {coverSaving ? "Saving..." : "Save"}
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="flex min-w-0 flex-1 flex-col justify-between">
          <div>
            {editingTitle ? (
              <input
                value={titleInput}
                onChange={(e) => setTitleInput(e.target.value)}
                onBlur={() => void saveTitle()}
                onKeyDown={(e) => {
                  if (e.key === "Enter") void saveTitle();
                  if (e.key === "Escape") {
                    setTitleInput(gameTitle);
                    setEditingTitle(false);
                  }
                }}
                className="block w-full border-0 bg-transparent p-0 text-center text-[28px] font-bold leading-tight text-app-muted outline-none focus:ring-0 sm:text-left"
                autoFocus
              />
            ) : (
              <h1
                className={cn(
                  "text-center text-[28px] font-bold leading-tight text-app-muted sm:text-left",
                  initial.game.source === "user" && "group/title"
                )}
              >
                <span>{gameTitle}</span>
                {initial.game.source === "user" && (
                  <button
                    type="button"
                    onClick={() => setEditingTitle(true)}
                    className="ml-2 inline-flex items-center gap-0.5 align-middle text-[12px] font-medium text-muted-foreground opacity-0 transition-opacity hover:text-foreground group-hover/title:opacity-100"
                  >
                    <PencilSimple size={12} />
                    Edit
                  </button>
                )}
              </h1>
            )}

            <div className="mt-1 space-y-1 text-[12px] font-medium uppercase text-muted-foreground sm:hidden">
              <div className="flex items-center justify-center gap-2">
                {initial.game.developerName && (
                  <span>{initial.game.developerName}</span>
                )}
                {initial.game.releaseDate && (
                  <>
                    {initial.game.developerName && <span>&middot;</span>}
                    <span>{new Date(initial.game.releaseDate).getFullYear()}</span>
                  </>
                )}
              </div>
              <div className="flex items-center justify-center gap-2">
                {initial.game.savedCount > 0 && (
                  <span className="inline-flex items-center gap-0.5">
                    <BookmarkSimple size={12} weight="fill" />
                    {initial.game.savedCount.toLocaleString()}
                  </span>
                )}
                {initial.game.aggregatedRating != null && (
                  <span className="inline-flex items-center gap-0.5">
                    <Star size={12} weight="fill" />
                    {(initial.game.aggregatedRating / 10).toFixed(1)}
                  </span>
                )}
              </div>
            </div>

            <p className="mt-1 hidden items-center gap-2 text-[12px] font-medium uppercase text-muted-foreground sm:flex">
              {initial.game.developerName && (
                <span>{initial.game.developerName}</span>
              )}
              {initial.game.releaseDate && (
                <>
                  {initial.game.developerName && <span>·</span>}
                  <span>{new Date(initial.game.releaseDate).getFullYear()}</span>
                </>
              )}
              {initial.game.savedCount > 0 && (
                <span className="inline-flex items-center gap-0.5">
                  <BookmarkSimple size={12} weight="fill" />
                  {initial.game.savedCount.toLocaleString()}
                </span>
              )}
              {initial.game.aggregatedRating != null && (
                <span className="inline-flex items-center gap-0.5">
                  <Star size={12} weight="fill" />
                  {(initial.game.aggregatedRating / 10).toFixed(1)}
                </span>
              )}
            </p>

            {initial.game.summary && (
              <p className="mt-2 max-w-2xl text-left text-[14px] leading-relaxed text-muted-foreground line-clamp-3">
                {initial.game.summary}
              </p>
            )}

            <div className="mt-4 flex flex-wrap items-center justify-center gap-4 sm:justify-start">
              <RouteRating value={rating} onChange={handleRatingSelect} />
              <StatusDropdown
                entryId={entryId}
                status={initial.status}
                gameTitle={gameTitle}
                onRemove={() => router.push("/library")}
              />
            </div>
          </div>

        </div>
      </div>

      {/* Notes */}
      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-[16px] font-bold text-app-muted">Notes</h2>
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
          <div className="relative">
            <textarea
              className="min-h-[120px] w-full rounded-lg border border-border bg-card px-4 py-3 text-[14px] leading-relaxed focus:outline-none focus:ring-2 focus:ring-[#656379]/30"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              onBlur={handleNotesBlur}
              maxLength={NOTES_MAX}
              autoFocus
              placeholder="Add notes about this game..."
            />
            {notes.length > NOTES_MAX * 0.75 && (
              <span
                className={cn(
                  "absolute bottom-2 right-3 select-none text-[11px] tabular-nums",
                  notes.length > NOTES_MAX * 0.9
                    ? "text-[#822B34]"
                    : "text-muted-foreground",
                )}
              >
                {notes.length.toLocaleString()}/{NOTES_MAX.toLocaleString()}
              </span>
            )}
          </div>
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

      {/* Content */}
      <section>
        <div className="mb-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h2 className="text-[16px] font-bold text-app-muted">
              Content
            </h2>
            {routes.length > 0 && (
              <div className="flex items-center gap-2">
                <div className="h-1.5 w-24 overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full rounded-full transition-all"
                    style={{
                      width: `${Math.round((completedCount / routes.length) * 100)}%`,
                      backgroundColor: routeProgressColor(completedCount / routes.length),
                    }}
                  />
                </div>
                <span className="text-[12px] tabular-nums text-muted-foreground">
                  {completedCount}/{routes.length}
                </span>
              </div>
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
              onUpdate={(updated) =>
                setRoutes((prev) =>
                  prev.map((x) => (x.id === r.id ? { ...x, ...updated } : x)),
                )
              }
              onDelete={() => deleteRoute(r.id)}
            />
          ))}

          {addingRoute && (
            <div className="flex items-center gap-2 rounded-lg bg-card px-4 py-3">
              <Input
                value={newRouteName}
                onChange={(e) => setNewRouteName(e.target.value)}
                placeholder="Content name..."
                className="h-8 flex-1 border-0 bg-transparent p-0 text-[14px] shadow-none focus-visible:ring-0"
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === "Enter") void addRoute();
                  if (e.key === "Escape") {
                    setAddingRoute(false);
                    setNewRouteName("");
                  }
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
                onClick={() => {
                  setAddingRoute(false);
                  setNewRouteName("");
                }}
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
                Nothing here yet. Track routes, DLC, chapters, or any other content within this game.
              </p>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

function RouteItem({
  route,
  entryId,
  onUpdate,
  onDelete,
}: {
  route: RouteRow;
  entryId: string;
  onUpdate: (updated: Partial<RouteRow>) => void;
  onDelete: () => void;
}) {
  const [editingName, setEditingName] = useState(false);
  const [name, setName] = useState(route.name);
  const [editingNotes, setEditingNotes] = useState(false);
  const [routeNotes, setRouteNotes] = useState(route.notes ?? "");
  const [editingImage, setEditingImage] = useState(false);
  const [imageInput, setImageInput] = useState("");
  const [imageError, setImageError] = useState<string | null>(null);
  const [imageSaving, setImageSaving] = useState(false);

  const patchRoute = useCallback(
    async (data: Record<string, unknown>) => {
      const res = await fetch(`/api/me/library/${entryId}/routes/${route.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (res.ok) {
        const json = await res.json();
        if (json.route) onUpdate(json.route);
      }
    },
    [entryId, route.id, onUpdate],
  );

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

  async function saveImageUrl() {
    const url = imageInput.trim() || null;
    if (url && !/^https?:\/\/.+\..+/.test(url)) {
      setImageError("Please enter a valid URL");
      return;
    }
    setImageSaving(true);
    setImageError(null);
    try {
      await patchRoute({ imageUrl: url });
      onUpdate({ imageUrl: url });
      setEditingImage(false);
      setImageInput("");
    } catch {
      setImageError("Failed to update image");
    } finally {
      setImageSaving(false);
    }
  }

  async function removeImage() {
    onUpdate({ imageUrl: null });
    await patchRoute({ imageUrl: null });
  }

  return (
    <div
      className="group flex items-start gap-4 rounded-[10px] border border-transparent bg-card p-4 transition-all hover:border-app-muted hover:shadow-[0_1px_1px_0_rgba(0,0,0,0.25)]"
    >
      {/* Avatar / image */}
      <div className="relative shrink-0">
        <div
          className="group/avatar flex h-[75px] w-[75px] cursor-pointer items-center justify-center overflow-hidden rounded-full border-2 border-app-muted bg-muted transition-colors"
          onClick={() => {
            if (!route.imageUrl) {
              setImageInput("");
              setImageError(null);
              setEditingImage(true);
            }
          }}
          title={route.imageUrl ? undefined : "Set image URL"}
        >
          {route.imageUrl ? (
            <img
              src={route.imageUrl}
              alt=""
              className="h-full w-full object-cover"
            />
          ) : (
            <span className="text-[14px] font-medium text-muted-foreground">
              {route.name.charAt(0).toUpperCase()}
            </span>
          )}
          {route.imageUrl ? (
            <div className="absolute inset-0 flex items-center justify-center gap-1 rounded-full bg-black/50 opacity-0 transition-opacity group-hover/avatar:opacity-100">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setImageInput(route.imageUrl ?? "");
                  setImageError(null);
                  setEditingImage(true);
                }}
                className="flex h-7 w-7 items-center justify-center rounded-full bg-white/20 text-white hover:bg-white/30"
                title="Change image"
              >
                <PencilSimple size={14} />
              </button>
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); void removeImage(); }}
                className="flex h-7 w-7 items-center justify-center rounded-full bg-white/20 text-white hover:bg-red-400/60"
                title="Remove image"
              >
                <X size={14} weight="bold" />
              </button>
            </div>
          ) : (
            <div className="absolute inset-0 flex items-center justify-center rounded-full bg-black/40 opacity-0 transition-opacity hover:opacity-100">
              <PencilSimple size={16} className="text-white" />
            </div>
          )}
        </div>

        {/* URL input popover */}
        {editingImage && (
          <div
            className="absolute left-0 top-full z-50 mt-2 w-[260px] rounded-lg border border-border bg-card p-3 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <p className="mb-2 text-[12px] font-medium text-app-muted">Image URL</p>
            <Input
              type="url"
              placeholder="https://..."
              value={imageInput}
              onChange={(e) => { setImageInput(e.target.value); setImageError(null); }}
              onKeyDown={(e) => {
                if (e.key === "Enter") void saveImageUrl();
                if (e.key === "Escape") setEditingImage(false);
              }}
              className="h-9 text-[13px]"
              autoFocus
            />
            {imageInput && /^https?:\/\/.+\..+/.test(imageInput.trim()) && (
              <div className="mt-2 flex items-center gap-2 rounded bg-muted/50 p-2">
                <div className="h-10 w-10 shrink-0 overflow-hidden rounded-full bg-muted">
                  { }
                  <img
                    src={imageInput.trim()}
                    alt="Preview"
                    className="h-full w-full object-cover"
                    onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                  />
                </div>
                <span className="text-[10px] text-muted-foreground">Preview</span>
              </div>
            )}
            {imageError && (
              <p className="mt-1 text-[11px] text-[#822B34]">{imageError}</p>
            )}
            <div className="mt-2 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setEditingImage(false)}
                className="rounded px-2 py-1 text-[11px] text-muted-foreground hover:bg-muted"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => void saveImageUrl()}
                disabled={imageSaving}
                className="rounded bg-[#656379] px-3 py-1 text-[11px] font-semibold text-white hover:opacity-90 disabled:opacity-50"
              >
                {imageSaving ? "Saving..." : "Save"}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <div className="min-w-0 flex-1">
            {editingName ? (
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                onBlur={handleNameSubmit}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleNameSubmit();
                  if (e.key === "Escape") {
                    setName(route.name);
                    setEditingName(false);
                  }
                }}
                className="h-6 w-full border-0 bg-transparent p-0 text-[14px] font-medium text-foreground outline-none focus:ring-0"
                autoFocus
              />
            ) : (
              <button
                type="button"
                className="group/name flex items-center gap-2 truncate text-[14px] font-medium text-foreground"
                onClick={() => setEditingName(true)}
              >
                <span className="truncate">{route.name}</span>
                <span className="flex shrink-0 items-center gap-0.5 text-[12px] text-muted-foreground opacity-0 transition-opacity group-hover/name:opacity-100">
                  <PencilSimple size={12} />
                  Edit
                </span>
              </button>
            )}
          </div>

          <div className="flex shrink-0 items-center gap-4">
            <RouteRating
              value={route.rating}
              onChange={(v) => {
                onUpdate({ rating: v });
                void patchRoute({ rating: v });
              }}
            />
            <RouteStatusPill status={route.status} onChange={handleStatusChange} onRemove={onDelete} />
          </div>
        </div>

        {/* Notes */}
        {editingNotes ? (
          <div className="relative mt-1">
            <textarea
              className="w-full resize-none rounded border border-border bg-transparent px-2 py-1 text-[13px] leading-relaxed text-foreground outline-none focus:ring-1 focus:ring-[#656379]/30"
              value={routeNotes}
              onChange={(e) => setRouteNotes(e.target.value)}
              onBlur={handleNotesBlur}
              onKeyDown={(e) => {
                if (e.key === "Escape") {
                  setRouteNotes(route.notes ?? "");
                  setEditingNotes(false);
                }
              }}
              maxLength={ROUTE_NOTES_MAX}
              autoFocus
              rows={2}
              placeholder="Add notes..."
            />
            {routeNotes.length > ROUTE_NOTES_MAX * 0.75 && (
              <span
                className={cn(
                  "absolute bottom-1.5 right-2 select-none text-[10px] tabular-nums",
                  routeNotes.length > ROUTE_NOTES_MAX * 0.9
                    ? "text-[#822B34]"
                    : "text-muted-foreground",
                )}
              >
                {routeNotes.length.toLocaleString()}/{ROUTE_NOTES_MAX.toLocaleString()}
              </span>
            )}
          </div>
        ) : (
          <p
            className="mt-1 cursor-pointer text-[13px] leading-relaxed text-muted-foreground hover:text-foreground"
            onClick={() => setEditingNotes(true)}
          >
            {route.notes || <span className="italic opacity-0 transition-opacity group-hover:opacity-100">Add notes...</span>}
          </p>
        )}
      </div>

    </div>
  );
}

function RouteStatusPill({ status, onChange, onRemove }: { status: EntryStatus; onChange: (s: EntryStatus) => void; onRemove?: () => void }) {
  const [open, setOpen] = useState(false);
  const [confirmRemove, setConfirmRemove] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        className={cn(
          "inline-flex cursor-pointer items-center gap-1.5 rounded-full px-3 py-1 font-mono text-[11px] font-bold",
          statusColor(status)
        )}
        onClick={() => setOpen((v) => !v)}
        onBlur={(e) => {
          if (!ref.current?.contains(e.relatedTarget as Node)) setOpen(false);
        }}
      >
        <StatusIcon status={status} />
        {statusLabel(status).toUpperCase()}
        <CaretDown size={10} />
      </button>
      {open && (
        <div className="absolute left-0 top-full z-50 mt-1 w-36 rounded-lg border border-border bg-card py-1">
          {STATUS_OPTIONS.map((o) => (
            <button
              key={o.value}
              type="button"
              className={cn(
                "flex w-full items-center gap-2 px-3 py-1.5 text-left text-[14px] text-app-muted",
                status === o.value ? "bg-muted" : "hover:bg-muted"
              )}
              onClick={() => { onChange(o.value); setOpen(false); }}
            >
              <StatusIcon status={o.value} />
              {o.label}
            </button>
          ))}
          {onRemove && (
            <>
              <div className="my-1 border-t border-border" />
              <button
                type="button"
                className="flex w-full items-center gap-2 px-3 py-1.5 text-left text-[14px] text-[#822B34] hover:bg-muted"
                onClick={() => { setOpen(false); setConfirmRemove(true); }}
              >
                <X size={12} weight="bold" />
                Remove
              </button>
            </>
          )}
        </div>
      )}
      <ConfirmDialog
        open={confirmRemove}
        title="Remove entry"
        description="This entry and its notes will be permanently deleted."
        confirmLabel="Remove"
        onConfirm={() => { setConfirmRemove(false); onRemove?.(); }}
        onCancel={() => setConfirmRemove(false)}
      />
    </div>
  );
}

function RouteRating({ value, onChange }: { value: number | null; onChange: (v: number | null) => void }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        className="flex items-center gap-1 text-[12px] font-medium text-muted-foreground"
        onClick={() => setOpen((v) => !v)}
        onBlur={(e) => {
          if (!ref.current?.contains(e.relatedTarget as Node)) setOpen(false);
        }}
      >
        <Star size={14} weight="fill" />
        Rating: {value != null ? `${value}/10` : "-/-"}
        <CaretDown size={10} />
      </button>
      {open && (
        <div className="absolute right-0 top-full z-50 mt-1 w-24 rounded-lg border border-border bg-card px-2 py-1.5">
          <button
            type="button"
            className={cn(
              "mb-1 block w-full rounded py-1 text-center text-[14px] text-app-muted",
              value == null ? "bg-muted" : "hover:bg-muted"
            )}
            onClick={() => { onChange(null); setOpen(false); }}
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
                  value === v ? "bg-muted" : "hover:bg-muted"
                )}
                onClick={() => { onChange(v); setOpen(false); }}
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

function routeProgressColor(ratio: number): string {
  if (ratio >= 1) return "#5DAE6E";
  if (ratio >= 0.5) return "#8EC5E2";
  if (ratio > 0) return "#D7D7D7";
  return "#E0E0E0";
}
