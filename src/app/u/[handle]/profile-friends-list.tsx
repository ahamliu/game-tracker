"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { Ghost, X } from "@phosphor-icons/react";

type FriendUser = {
  id: string;
  handle: string;
  displayName: string;
  avatarUrl: string | null;
};

export function ProfileFriendCount({
  handle,
  count,
}: {
  handle: string;
  count: number;
}) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex items-center gap-1.5 hover:underline"
      >
        <span className="font-bold text-[#646373]">{count}</span>
        <span className="text-muted-foreground">{count === 1 ? "friend" : "friends"}</span>
      </button>
      {open && (
        <FriendsListModal handle={handle} onClose={() => setOpen(false)} />
      )}
    </>
  );
}

function FriendsListModal({ handle, onClose }: { handle: string; onClose: () => void }) {
  const overlayRef = useRef<HTMLDivElement>(null);
  const [friends, setFriends] = useState<FriendUser[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(`/api/users/${handle}/friends`);
        if (res.ok) {
          const data = await res.json();
          setFriends(data.friends);
        }
      } catch { /* ignore */ }
      setLoading(false);
    }
    void load();
  }, [handle]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-50 flex items-start justify-center bg-black/50 pt-[15vh]"
      onClick={(e) => {
        if (e.target === overlayRef.current) onClose();
      }}
    >
      <div className="w-full max-w-[400px] overflow-hidden rounded-xl border border-border bg-card shadow-xl">
        <div className="flex items-center justify-between border-b border-border px-5 py-4">
          <h2 className="text-[16px] font-bold text-[#646373]">Friends</h2>
          <button
            type="button"
            onClick={onClose}
            className="flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground"
          >
            <X size={16} />
          </button>
        </div>

        <div className="max-h-[360px] overflow-y-auto">
          {loading && (
            <p className="px-5 py-6 text-center text-[12px] text-muted-foreground">Loading...</p>
          )}

          {!loading && friends.length === 0 && (
            <p className="px-5 py-6 text-center text-[12px] text-muted-foreground">No friends yet.</p>
          )}

          {friends.map((f) => (
            <Link
              key={f.id}
              href={`/u/${f.handle}`}
              onClick={onClose}
              className="flex items-center gap-3 px-5 py-3 transition-colors hover:bg-muted/50"
            >
              <div className="relative flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full bg-[#656379]">
                {f.avatarUrl ? (
                  <Image src={f.avatarUrl} alt="" fill unoptimized className="rounded-full object-cover" />
                ) : (
                  <Ghost size={16} className="text-white" />
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-[14px] font-semibold text-[#646373]">{f.displayName}</p>
                <p className="truncate text-[12px] text-muted-foreground">@{f.handle}</p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
