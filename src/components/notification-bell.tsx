"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Bell, Ghost, Check, X } from "@phosphor-icons/react";

type NotificationItem = {
  id: string;
  type: string;
  referenceId: string | null;
  read: boolean;
  createdAt: string;
  senderHandle: string | null;
  senderDisplayName: string | null;
  senderAvatarUrl: string | null;
  requestStatus: "pending" | "accepted" | "declined" | null;
};

function timeAgo(date: string): string {
  const now = Date.now();
  const diff = now - new Date(date).getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return `${Math.floor(days / 7)}w ago`;
}

export function NotificationBell({ initialUnread }: { initialUnread: number }) {
  const router = useRouter();
  const [unread, setUnread] = useState(initialUnread);
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  // Poll for unread count every 30s
  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const res = await fetch("/api/me/notifications/unread-count");
        if (res.ok) {
          const data = await res.json();
          setUnread(data.count);
        }
      } catch { /* ignore */ }
    }, 30_000);
    return () => clearInterval(interval);
  }, []);

  const fetchNotifications = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/me/notifications");
      if (res.ok) {
        const data = await res.json();
        setItems(data.notifications);
      }
    } catch { /* ignore */ }
    setLoading(false);
  }, []);

  async function markRead() {
    if (unread > 0) {
      setUnread(0);
      await fetch("/api/me/notifications/read", { method: "PATCH" });
    }
  }

  function handleOpen() {
    const willOpen = !open;
    setOpen(willOpen);
    if (willOpen) {
      void fetchNotifications();
      void markRead();
    }
  }

  async function handleAction(requestId: string, action: "accept" | "decline") {
    setActionLoading(requestId);
    const res = await fetch(`/api/me/friend-requests/${requestId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action }),
    });
    setActionLoading(null);
    if (res.ok) {
      setItems((prev) =>
        prev.map((n) =>
          n.referenceId === requestId
            ? { ...n, requestStatus: action === "accept" ? "accepted" as const : "declined" as const }
            : n
        )
      );
      router.refresh();
    }
  }

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={handleOpen}
        className="relative flex h-9 w-9 items-center justify-center rounded-full text-app-muted hover:bg-muted"
      >
        <Bell size={22} weight="fill" />
        {unread > 0 && (
          <span className="absolute -top-0.5 -right-0.5 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-[#822B34] px-1 text-[10px] font-bold text-white">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full z-50 mt-1.5 w-[340px] rounded-xl border border-border bg-card shadow-lg">
          <div className="border-b border-border px-4 py-3">
            <h3 className="text-[13px] font-bold text-app-muted">Notifications</h3>
          </div>

          <div className="max-h-[360px] overflow-y-auto">
            {loading && items.length === 0 && (
              <p className="px-4 py-6 text-center text-[14px] text-muted-foreground">Loading...</p>
            )}

            {!loading && items.length === 0 && (
              <p className="px-4 py-6 text-center text-[14px] text-muted-foreground">No notifications yet</p>
            )}

            {items.map((n) => (
              <div key={n.id} className="flex items-start gap-3 border-b border-border px-4 py-3 last:border-0">
                <Link
                  href={n.senderHandle ? `/u/${n.senderHandle}` : "#"}
                  className="relative mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-full bg-[#656379]"
                  onClick={() => setOpen(false)}
                >
                  {n.senderAvatarUrl ? (
                    <Image src={n.senderAvatarUrl} alt="" fill unoptimized className="rounded-full object-cover" />
                  ) : (
                    <Ghost size={14} className="text-white" />
                  )}
                </Link>

                <div className="min-w-0 flex-1">
                  <p className="text-[14px] leading-relaxed text-app-muted">
                    <Link
                      href={n.senderHandle ? `/u/${n.senderHandle}` : "#"}
                      className="font-bold hover:underline"
                      onClick={() => setOpen(false)}
                    >
                      {n.senderDisplayName ?? n.senderHandle ?? "Someone"}
                    </Link>
                    {n.type === "friend_request" && n.requestStatus === "pending" && " sent you a friend request."}
                    {n.type === "friend_request" && n.requestStatus === "accepted" && " — friend request accepted!"}
                    {n.type === "friend_request" && n.requestStatus === "declined" && " — friend request declined."}
                    {n.type === "friend_request_accepted" && " accepted your friend request."}
                  </p>
                  <p className="mt-0.5 text-[11px] text-muted-foreground">{timeAgo(n.createdAt)}</p>

                  {n.type === "friend_request" && n.requestStatus === "pending" && n.referenceId && (
                    <div className="mt-2 flex gap-1.5">
                      <button
                        type="button"
                        disabled={actionLoading === n.referenceId}
                        onClick={() => handleAction(n.referenceId!, "accept")}
                        className="flex items-center gap-1 rounded-md bg-[#656379] px-3 py-1 text-[11px] font-semibold text-white hover:opacity-90 disabled:opacity-50"
                      >
                        <Check size={12} weight="bold" />
                        Accept
                      </button>
                      <button
                        type="button"
                        disabled={actionLoading === n.referenceId}
                        onClick={() => handleAction(n.referenceId!, "decline")}
                        className="flex items-center gap-1 rounded-md border border-border px-3 py-1 text-[11px] font-semibold text-app-muted hover:bg-muted disabled:opacity-50"
                      >
                        <X size={12} weight="bold" />
                        Decline
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
