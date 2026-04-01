"use client";

import { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Ghost, PencilSimple, X } from "@phosphor-icons/react";
import { Input } from "@/components/ui/input";

export function ProfileAvatar({
  avatarUrl,
  isSelf,
}: {
  avatarUrl: string | null;
  isSelf: boolean;
}) {
  const router = useRouter();
  const [url, setUrl] = useState(avatarUrl);
  const [editing, setEditing] = useState(false);
  const [input, setInput] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function save() {
    const trimmed = input.trim();
    if (!trimmed) return;
    try {
      new URL(trimmed);
    } catch {
      setError("Enter a valid URL");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/me/avatar", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ avatarUrl: trimmed }),
      });
      if (res.ok) {
        setUrl(trimmed);
        setEditing(false);
        setInput("");
        router.refresh();
      } else {
        setError("Failed to update avatar");
      }
    } finally {
      setSaving(false);
    }
  }

  async function remove() {
    setSaving(true);
    try {
      const res = await fetch("/api/me/avatar", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ avatarUrl: null }),
      });
      if (res.ok) {
        setUrl(null);
        router.refresh();
      }
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="relative shrink-0">
      <div
        className={`group/avatar flex h-24 w-24 items-center justify-center overflow-hidden rounded-full bg-[hsl(248,11%,43%)] ${isSelf ? "cursor-pointer" : ""}`}
        onClick={() => {
          if (!isSelf || url) return;
          setInput("");
          setError(null);
          setEditing(true);
        }}
        title={isSelf && !url ? "Set profile image" : undefined}
      >
        {url ? (
          <Image
            src={url}
            alt=""
            width={96}
            height={96}
            unoptimized
            className="h-full w-full object-cover"
          />
        ) : (
          <Ghost size={40} className="text-white" />
        )}

        {isSelf && url && (
          <div className="absolute inset-0 flex items-center justify-center gap-1 rounded-full bg-black/50 opacity-0 transition-opacity group-hover/avatar:opacity-100">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setInput(url);
                setError(null);
                setEditing(true);
              }}
              className="flex h-7 w-7 items-center justify-center rounded-full bg-white/20 text-white hover:bg-white/30"
              title="Change image"
            >
              <PencilSimple size={14} />
            </button>
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); void remove(); }}
              disabled={saving}
              className="flex h-7 w-7 items-center justify-center rounded-full bg-white/20 text-white hover:bg-red-400/60"
              title="Remove image"
            >
              <X size={14} weight="bold" />
            </button>
          </div>
        )}

        {isSelf && !url && (
          <div className="absolute inset-0 flex items-center justify-center rounded-full bg-black/40 opacity-0 transition-opacity hover:opacity-100">
            <PencilSimple size={16} className="text-white" />
          </div>
        )}
      </div>

      {editing && (
        <div
          className="absolute left-0 top-full z-50 mt-2 w-[260px] rounded-lg border border-border bg-card p-3 shadow-xl"
          onClick={(e) => e.stopPropagation()}
        >
          <p className="mb-2 text-[12px] font-medium text-[#646373]">Image URL</p>
          <Input
            type="url"
            placeholder="https://..."
            value={input}
            onChange={(e) => { setInput(e.target.value); setError(null); }}
            onKeyDown={(e) => {
              if (e.key === "Enter") void save();
              if (e.key === "Escape") setEditing(false);
            }}
            className="h-9 text-[13px]"
            autoFocus
          />
          {error && <p className="mt-1 text-[11px] text-destructive">{error}</p>}
          <div className="mt-2 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setEditing(false)}
              className="text-[12px] text-muted-foreground hover:text-foreground"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => void save()}
              disabled={!input.trim() || saving}
              className="text-[12px] font-semibold text-[#656379] hover:opacity-80 disabled:opacity-40"
            >
              {saving ? "Saving…" : "Save"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
