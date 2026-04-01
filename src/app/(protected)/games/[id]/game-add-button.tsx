"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus } from "@phosphor-icons/react";

export function GameAddButton({ gameId }: { gameId: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleAdd() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/me/library", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ gameId, status: "planning" }),
      });
      const data = await res.json();

      if (res.status === 409 && data.error?.entryId) {
        router.push(`/library/${data.error.entryId}`);
        return;
      }
      if (!res.ok) {
        setError("Failed to add game.");
        setLoading(false);
        return;
      }
      if (data.entry?.id) {
        router.push(`/library/${data.entry.id}`);
      }
    } catch {
      setError("Network error.");
      setLoading(false);
    }
  }

  return (
    <div>
      <button
        type="button"
        onClick={() => void handleAdd()}
        disabled={loading}
        className="inline-flex h-10 items-center gap-1.5 rounded-lg bg-[#656379] px-5 font-mono text-[13px] font-semibold uppercase tracking-wider text-white hover:opacity-90 disabled:opacity-50"
      >
        <Plus size={14} weight="bold" />
        {loading ? "Adding..." : "Add to Library"}
      </button>
      {error && (
        <p className="mt-2 text-[12px] text-destructive">{error}</p>
      )}
    </div>
  );
}
