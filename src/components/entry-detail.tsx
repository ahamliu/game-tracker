"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { EntryStatus } from "@/lib/status";
import { STATUS_OPTIONS, statusLabel } from "@/lib/status";

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
  const [status, setStatus] = useState<EntryStatus>(initial.status);
  const [rating, setRating] = useState(initial.rating?.toString() ?? "");
  const [notes, setNotes] = useState(initial.notes ?? "");
  const [progressPercent, setProgressPercent] = useState(initial.progressPercent?.toString() ?? "");
  const [progressNote, setProgressNote] = useState(initial.progressNote ?? "");
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  const [routeName, setRouteName] = useState("");
  const [routeStatus, setRouteStatus] = useState<EntryStatus>("planning");
  const [routeRating, setRouteRating] = useState("");
  const [routeNotes, setRouteNotes] = useState("");
  const [routes, setRoutes] = useState(initial.routes);
  const [uploading, setUploading] = useState<string | null>(null);

  const routeWarning = useMemo(() => routes.length >= 48, [routes.length]);

  async function saveEntry(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setMsg(null);
    const res = await fetch(`/api/me/library/${entryId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        status,
        rating: rating === "" ? null : Number(rating),
        notes: notes || null,
        progressPercent: progressPercent === "" ? null : Number(progressPercent),
        progressNote: progressNote || null,
      }),
    });
    setSaving(false);
    if (!res.ok) {
      setMsg("Could not save.");
      return;
    }
    setMsg("Saved.");
    router.refresh();
  }

  async function addRoute(e: React.FormEvent) {
    e.preventDefault();
    setMsg(null);
    const res = await fetch(`/api/me/library/${entryId}/routes`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: routeName,
        status: routeStatus,
        rating: routeRating === "" ? null : Number(routeRating),
        notes: routeNotes || null,
      }),
    });
    const data = await res.json();
    if (!res.ok) {
      setMsg(data?.error?.message ?? "Could not add route");
      return;
    }
    if (data.route) setRoutes((r) => [...r, data.route]);
    setRouteName("");
    setRouteRating("");
    setRouteNotes("");
    router.refresh();
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

  async function removeFromLibrary() {
    if (!confirm("Remove this game from your library? Routes will be deleted.")) return;
    const res = await fetch(`/api/me/library/${entryId}`, { method: "DELETE" });
    if (res.ok) router.push("/library");
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap gap-6">
        <div className="relative h-48 w-32 shrink-0 overflow-hidden rounded-lg bg-muted sm:h-56 sm:w-40">
          {initial.game.coverUrl ? (
            <img
              src={initial.game.coverUrl}
              alt=""
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="flex h-full items-center justify-center p-2 text-center text-xs text-muted-foreground">
              No cover
            </div>
          )}
        </div>
        <div className="min-w-0 flex-1 space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">{initial.game.title}</h1>
          {initial.game.summary && (
            <p className="max-w-3xl text-sm text-muted-foreground line-clamp-4">{initial.game.summary}</p>
          )}
          <Button type="button" variant="destructive" size="sm" onClick={removeFromLibrary}>
            Remove from library
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Your progress</CardTitle>
          <CardDescription>Status, rating, and notes apply to the whole title.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={saveEntry} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <select
                  id="status"
                  className="flex h-10 w-full rounded-md border border-border bg-card px-3 text-sm"
                  value={status}
                  onChange={(e) => setStatus(e.target.value as EntryStatus)}
                >
                  {STATUS_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="rating">Rating (0–10)</Label>
                <Input
                  id="rating"
                  type="number"
                  min={0}
                  max={10}
                  value={rating}
                  onChange={(e) => setRating(e.target.value)}
                />
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="progressPercent">Progress %</Label>
                <Input
                  id="progressPercent"
                  type="number"
                  min={0}
                  max={100}
                  value={progressPercent}
                  onChange={(e) => setProgressPercent(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="progressNote">Progress note</Label>
                <Input
                  id="progressNote"
                  placeholder="Chapter, label…"
                  value={progressNote}
                  onChange={(e) => setProgressNote(e.target.value)}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <textarea
                id="notes"
                className="min-h-[100px] w-full rounded-md border border-border bg-card px-3 py-2 text-sm"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>
            {msg && <p className="text-sm text-muted-foreground">{msg}</p>}
            <Button type="submit" disabled={saving}>
              {saving ? "Saving…" : "Save changes"}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Character routes</CardTitle>
          <CardDescription>
            Track each route separately. Completing a route does not complete the whole game unless you set it above.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {routeWarning && (
            <p className="text-sm text-amber-900">
              You have {routes.length} routes (soft cap 50). Consider archiving notes elsewhere for huge catalogs.
            </p>
          )}
          <form onSubmit={addRoute} className="space-y-3 rounded-lg border border-border p-4">
            <p className="text-sm font-medium">Add route</p>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Name</Label>
                <Input value={routeName} onChange={(e) => setRouteName(e.target.value)} required />
              </div>
              <div className="space-y-2">
                <Label>Status</Label>
                <select
                  className="flex h-10 w-full rounded-md border border-border bg-card px-3 text-sm"
                  value={routeStatus}
                  onChange={(e) => setRouteStatus(e.target.value as EntryStatus)}
                >
                  {STATUS_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Rating (0–10)</Label>
                <Input value={routeRating} onChange={(e) => setRouteRating(e.target.value)} type="number" min={0} max={10} />
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label>Notes</Label>
                <textarea
                  className="min-h-[72px] w-full rounded-md border border-border bg-card px-3 py-2 text-sm"
                  value={routeNotes}
                  onChange={(e) => setRouteNotes(e.target.value)}
                />
              </div>
            </div>
            <Button type="submit">Add route</Button>
          </form>

          <ul className="space-y-4">
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
          </ul>
        </CardContent>
      </Card>
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

  async function removeImage() {
    onUpdate({ imageUrl: null });
    await patchRoute({ imageUrl: null });
  }

  return (
    <li className="flex flex-col gap-3 rounded-lg border border-border p-4 sm:flex-row sm:items-start">
      <div className="relative h-28 w-20 shrink-0 overflow-hidden rounded-md bg-muted">
        {route.imageUrl ? (
          <img src={route.imageUrl} alt="" className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full items-center justify-center text-[10px] text-muted-foreground">No image</div>
        )}
      </div>
      <div className="min-w-0 flex-1 space-y-1">
        {editingName ? (
          <form
            onSubmit={(e) => { e.preventDefault(); handleNameSubmit(); }}
            className="flex items-center gap-2"
          >
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="h-8 text-sm"
              autoFocus
              onBlur={handleNameSubmit}
            />
          </form>
        ) : (
          <button
            type="button"
            className="font-medium hover:underline"
            onClick={() => setEditingName(true)}
            title="Click to rename"
          >
            {route.name}
          </button>
        )}
        <div className="flex items-center gap-2">
          <select
            className="rounded-md border border-border bg-card px-2 py-1 text-sm"
            value={route.status}
            onChange={(e) => handleStatusChange(e.target.value as EntryStatus)}
          >
            {STATUS_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
          {route.rating != null && (
            <span className="text-sm text-muted-foreground">{route.rating}/10</span>
          )}
        </div>
        {route.notes && <p className="text-sm text-muted-foreground whitespace-pre-wrap">{route.notes}</p>}
        <div className="flex flex-wrap gap-2 pt-2">
          <label className="text-xs text-muted-foreground">
            <span className="mr-2">Reference image</span>
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="text-xs"
              disabled={uploading}
              onChange={(e) => onUpload(e.target.files?.[0] ?? null)}
            />
          </label>
          {route.imageUrl && (
            <Button type="button" variant="secondary" size="sm" onClick={removeImage}>
              Remove image
            </Button>
          )}
          <Button type="button" variant="destructive" size="sm" onClick={onDelete}>
            Delete
          </Button>
        </div>
      </div>
    </li>
  );
}
