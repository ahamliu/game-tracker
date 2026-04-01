"use client";

import { useState, useRef, useEffect } from "react";
import Image from "next/image";
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
        className="relative flex h-9 w-9 items-center justify-center rounded-full bg-[#656379] overflow-hidden"
      >
        {user.image ? (
          <Image src={user.image} alt="" fill unoptimized className="rounded-full object-cover" />
        ) : (
          <Ghost size={18} className="text-white" />
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full z-50 mt-1 w-36 rounded-lg border border-border bg-card py-1">
          <Link
            href="/library"
            className="block px-3 py-1.5 text-[14px] text-app-muted hover:bg-muted"
            onClick={() => setOpen(false)}
          >
            My Library
          </Link>
          <Link
            href={`/u/${user.handle}`}
            className="block px-3 py-1.5 text-[14px] text-app-muted hover:bg-muted"
            onClick={() => setOpen(false)}
          >
            Profile
          </Link>
          <Link
            href="/settings"
            className="block px-3 py-1.5 text-[14px] text-app-muted hover:bg-muted"
            onClick={() => setOpen(false)}
          >
            Settings
          </Link>
          <button
            type="button"
            className="block w-full px-3 py-1.5 text-left text-[14px] text-app-muted hover:bg-muted"
            onClick={() => signOut({ callbackUrl: "/" })}
          >
            Sign Out
          </button>
        </div>
      )}
    </div>
  );
}
