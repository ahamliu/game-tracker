"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { UserPlus, UserMinus, Clock, Check, X } from "@phosphor-icons/react";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { showSnackbar } from "@/components/snackbar";

export type FriendState =
  | { kind: "none" }
  | { kind: "request_sent" }
  | { kind: "request_received"; requestId: string }
  | { kind: "friends"; friendshipId: string };

export function ProfileFriendButton({
  targetUserId,
  targetName,
  initialState,
}: {
  targetUserId: string;
  targetName: string;
  initialState: FriendState;
}) {
  const router = useRouter();
  const [state, setState] = useState<FriendState>(initialState);
  const [busy, setBusy] = useState(false);
  const [confirmUnfriend, setConfirmUnfriend] = useState(false);

  async function sendRequest() {
    setBusy(true);
    const res = await fetch("/api/me/friend-requests", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ receiverId: targetUserId }),
    });
    setBusy(false);
    if (res.ok) {
      setState({ kind: "request_sent" });
      router.refresh();
    }
  }

  async function respondToRequest(action: "accept" | "decline") {
    if (state.kind !== "request_received") return;
    setBusy(true);
    const res = await fetch(`/api/me/friend-requests/${state.requestId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action }),
    });
    setBusy(false);
    if (res.ok) {
      setState(action === "accept" ? { kind: "friends", friendshipId: "" } : { kind: "none" });
      router.refresh();
    }
  }

  async function unfriend() {
    if (state.kind !== "friends") return;
    setConfirmUnfriend(false);
    setBusy(true);
    const res = await fetch(`/api/me/friends/${state.friendshipId}`, { method: "DELETE" });
    setBusy(false);
    if (res.ok) {
      setState({ kind: "none" });
      showSnackbar(`${targetName} removed from friends`);
      router.refresh();
    }
  }

  if (state.kind === "request_received") {
    return (
      <div className="flex items-center gap-1.5">
        <button
          type="button"
          disabled={busy}
          onClick={() => respondToRequest("accept")}
          className="flex items-center gap-1.5 rounded-lg bg-[#656379] px-4 py-2 font-mono text-[12px] font-semibold uppercase text-white hover:opacity-90 disabled:opacity-50"
        >
          <Check size={14} weight="bold" />
          Accept
        </button>
        <button
          type="button"
          disabled={busy}
          onClick={() => respondToRequest("decline")}
          className="flex items-center gap-1.5 rounded-lg border border-border px-4 py-2 font-mono text-[12px] font-semibold uppercase text-app-muted hover:bg-muted disabled:opacity-50"
        >
          <X size={14} weight="bold" />
          Decline
        </button>
      </div>
    );
  }

  if (state.kind === "request_sent") {
    return (
      <button
        type="button"
        disabled
        className="flex items-center gap-1.5 rounded-lg border border-border bg-card px-4 py-2 font-mono text-[12px] font-semibold uppercase text-muted-foreground"
      >
        <Clock size={14} weight="bold" />
        Request Sent
      </button>
    );
  }

  if (state.kind === "friends") {
    return (
      <>
        <button
          type="button"
          disabled={busy}
          onClick={() => setConfirmUnfriend(true)}
          className="group flex items-center gap-1.5 rounded-lg border border-border bg-card px-4 py-2 font-mono text-[12px] font-semibold uppercase text-app-muted transition-colors hover:border-[#822B34] hover:bg-[#822B34]/5 hover:text-[#822B34] disabled:opacity-50"
        >
          <UserMinus size={14} weight="bold" className="hidden group-hover:block" />
          <Check size={14} weight="bold" className="block group-hover:hidden" />
          <span className="hidden group-hover:inline">Unfriend</span>
          <span className="inline group-hover:hidden">Friends</span>
        </button>
        <ConfirmDialog
          open={confirmUnfriend}
          title="Remove friend"
          description={`Are you sure you want to remove ${targetName} from your friends list?`}
          confirmLabel="Unfriend"
          onConfirm={() => void unfriend()}
          onCancel={() => setConfirmUnfriend(false)}
        />
      </>
    );
  }

  return (
    <button
      type="button"
      disabled={busy}
      onClick={sendRequest}
      className="flex items-center gap-1.5 rounded-lg bg-[#656379] px-4 py-2 font-mono text-[12px] font-semibold uppercase text-white hover:opacity-90 disabled:opacity-50"
    >
      <UserPlus size={14} weight="bold" />
      Add as Friend
    </button>
  );
}
