import Link from "next/link";
import type { Session } from "next-auth";
import { UserMenu } from "@/components/user-menu";
import { NavSearch } from "@/components/nav-search";
import { Ghost } from "@phosphor-icons/react/dist/ssr";

export function SiteHeader({ session }: { session: Session | null }) {
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
          <NavSearch />
        </div>

        <nav className="flex shrink-0 items-center">
          {session ? (
            <UserMenu user={session.user} />
          ) : (
            <Link
              href="/login"
              className="flex h-9 w-9 items-center justify-center rounded-full"
              style={{ backgroundColor: "hsl(248,11%,43%)" }}
            >
                    <Ghost size={18} className="text-white" weight="fill" />
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
}
