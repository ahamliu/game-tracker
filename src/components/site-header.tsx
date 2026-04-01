"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import Link from "next/link";
import type { Session } from "next-auth";
import { MagnifyingGlass, BookmarkSimple } from "@phosphor-icons/react";
import { UserMenu } from "@/components/user-menu";
import { NavSearch } from "@/components/nav-search";
import { ThemeToggle } from "@/components/theme-toggle";
import { NotificationBell } from "@/components/notification-bell";

export function SiteHeader({ session, avatarUrl, unreadCount = 0 }: { session: Session | null; avatarUrl?: string | null; unreadCount?: number }) {
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
  const [mobileSearchPhase, setMobileSearchPhase] = useState<"entering" | "visible" | "exiting">("entering");
  const overlayRef = useRef<HTMLDivElement>(null);

  const openMobileSearch = useCallback(() => {
    setMobileSearchPhase("entering");
    setMobileSearchOpen(true);
    requestAnimationFrame(() => {
      requestAnimationFrame(() => setMobileSearchPhase("visible"));
    });
  }, []);

  const closeMobileSearch = useCallback(() => {
    setMobileSearchPhase("exiting");
    setTimeout(() => setMobileSearchOpen(false), 200);
  }, []);

  useEffect(() => {
    if (!mobileSearchOpen) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") closeMobileSearch();
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [mobileSearchOpen, closeMobileSearch]);

  return (
    <>
      <header className="sticky top-0 z-40 border-b border-border bg-card">
        <div className="flex h-[80px] items-center px-4 md:h-[85px]">
          <Link
            href="/"
            className="shrink-0 font-display text-[20px] uppercase text-[#646373] md:text-[24px]"
          >
            PlayLog
          </Link>

          <div className="mx-auto hidden flex-1 justify-center md:flex">
            <NavSearch signedIn={!!session} />
          </div>

          <nav className="ml-auto flex shrink-0 items-center gap-2">
            <button
              type="button"
              className="flex h-9 w-9 items-center justify-center rounded-md text-[#646373] hover:bg-muted md:hidden"
              onClick={openMobileSearch}
            >
              <MagnifyingGlass size={22} weight="bold" />
            </button>
            <Link
              href="/library"
              className="flex h-9 w-9 items-center justify-center rounded-md text-[#646373] hover:bg-muted md:hidden"
            >
              <BookmarkSimple size={22} weight="fill" />
            </Link>
            <ThemeToggle />
            {session ? (
              <>
                <NotificationBell initialUnread={unreadCount} />
                <UserMenu user={{ ...session.user, image: avatarUrl }} />
              </>
            ) : (
              <Link
                href="/login"
                className="rounded-lg bg-[#656379] px-5 py-2 font-mono text-[12px] font-semibold uppercase text-white hover:opacity-90"
              >
                Sign in
              </Link>
            )}
          </nav>
        </div>
      </header>

      {mobileSearchOpen && (
        <div
          ref={overlayRef}
          className="fixed inset-0 z-50 bg-black/50 md:hidden"
          onClick={(e) => { if (e.target === overlayRef.current) closeMobileSearch(); }}
        >
          <div
            className="border-b border-border bg-card px-4 pb-4 pt-3 shadow-lg transition-all duration-200 ease-out"
            style={{
              opacity: mobileSearchPhase === "visible" ? 1 : 0,
              transform: mobileSearchPhase === "entering"
                ? "translateY(-20px)"
                : mobileSearchPhase === "exiting"
                  ? "translateY(-12px)"
                  : "translateY(0)",
            }}
          >
            <NavSearch signedIn={!!session} autoFocus onNavigate={closeMobileSearch} />
          </div>
        </div>
      )}
    </>
  );
}
