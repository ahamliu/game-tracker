"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { UserPlus, UserMinus } from "@phosphor-icons/react";

export function ProfileFollowButton({
  handle,
  initialFollowing,
}: {
  handle: string;
  initialFollowing: boolean;
}) {
  const router = useRouter();
  const [following, setFollowing] = useState(initialFollowing);
  const [busy, setBusy] = useState(false);

  async function toggle() {
    setBusy(true);
    const method = following ? "DELETE" : "POST";
    const res = await fetch(`/api/users/${handle}/follow`, { method });
    setBusy(false);
    if (!res.ok) return;
    const data = await res.json();
    setFollowing(!!data.following);
    router.refresh();
  }

  return (
    <button
      type="button"
      disabled={busy}
      onClick={() => void toggle()}
      className={`flex items-center gap-1.5 rounded-lg px-4 py-2 font-mono text-[12px] font-semibold uppercase transition-colors disabled:opacity-50 ${
        following
          ? "border border-border bg-card text-[#646373] hover:border-[#822B34] hover:bg-[#822B34]/5 hover:text-[#822B34]"
          : "bg-[#656379] text-white hover:opacity-90"
      }`}
    >
      {following ? (
        <>
          <UserMinus size={14} weight="bold" />
          Following
        </>
      ) : (
        <>
          <UserPlus size={14} weight="bold" />
          Follow
        </>
      )}
    </button>
  );
}
