"use client";

import { useState } from "react";
import { Copy, Check } from "@phosphor-icons/react";

export function CopyProfileUrl({ handle }: { handle: string }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    const url = `${window.location.origin}/u/${handle}`;
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <button
      type="button"
      onClick={copy}
      className="group/copy relative flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-[#646373]"
    >
      {copied ? <Check size={14} weight="bold" /> : <Copy size={14} />}
      <span className="pointer-events-none absolute -top-8 left-1/2 -translate-x-1/2 whitespace-nowrap rounded bg-[#333] px-2 py-1 text-[11px] text-white opacity-0 shadow transition-opacity group-hover/copy:opacity-100 dark:bg-[#e5e5e5] dark:text-[#1a1a1a]">
        {copied ? "Copied!" : "Copy URL"}
      </span>
    </button>
  );
}
