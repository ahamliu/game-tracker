"use client";

import { useState, useRef, useEffect } from "react";
import { signOut } from "next-auth/react";
import Link from "next/link";
import { Ghost } from "@phosphor-icons/react";

export function UserMenu({
  user,
}: {
  user: { name?: string | null; email?: string | null; handle: string; image?: string | null };
}) {
  const [open, setOpen] = useState(false);
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

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex h-9 w-9 items-center justify-center rounded-full bg-[#656379]"
      >
        {user.image ? (
          <img src={user.image} alt="" className="h-full w-full rounded-full object-cover" />
        ) : (
          <Ghost size={18} className="text-white" />
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full z-50 mt-2 w-40 rounded-lg border border-border bg-card py-1">
          <Link
            href={`/u/${user.handle}`}
            className="block px-4 py-2 text-sm text-foreground hover:bg-muted"
            onClick={() => setOpen(false)}
          >
            Profile
          </Link>
          <Link
            href="/settings"
            className="block px-4 py-2 text-sm text-foreground hover:bg-muted"
            onClick={() => setOpen(false)}
          >
            Settings
          </Link>
          <button
            type="button"
            className="block w-full px-4 py-2 text-left text-sm text-foreground hover:bg-muted"
            onClick={() => signOut({ callbackUrl: "/" })}
          >
            Sign out
          </button>
        </div>
      )}
    </div>
  );
}
