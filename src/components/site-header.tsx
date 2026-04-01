import Link from "next/link";
import type { Session } from "next-auth";
import { UserMenu } from "@/components/user-menu";
import { NavSearch } from "@/components/nav-search";
import { ThemeToggle } from "@/components/theme-toggle";
import { NotificationBell } from "@/components/notification-bell";

export function SiteHeader({ session, avatarUrl, unreadCount = 0 }: { session: Session | null; avatarUrl?: string | null; unreadCount?: number }) {
  return (
    <header className="sticky top-0 z-40 border-b border-border bg-card">
      <div className="flex h-[85px] items-center px-4">
        <Link
          href="/"
          className="shrink-0 font-display text-[24px] uppercase text-[#646373]"
        >
          PlayLog
        </Link>

        <div className="mx-auto flex-1 flex justify-center">
          <NavSearch signedIn={!!session} />
        </div>

        <nav className="flex shrink-0 items-center gap-2">
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
  );
}
