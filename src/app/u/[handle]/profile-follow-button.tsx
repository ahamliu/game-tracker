"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";

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
    <Button type="button" variant={following ? "secondary" : "default"} disabled={busy} onClick={() => void toggle()}>
      {following ? "Following" : "Follow"}
    </Button>
  );
}
