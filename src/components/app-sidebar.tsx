"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import Image from "next/image";
import { GameController, BookmarkSimple, Ghost } from "@phosphor-icons/react";
import { cn } from "@/lib/utils";

type NavItem = {
  label: string;
  href: string;
  icon: React.ElementType;
};

const navItems: NavItem[] = [
  { label: "Home", href: "/", icon: GameController },
  { label: "My Library", href: "/library", icon: BookmarkSimple },
];

export function AppSidebar({
  handle,
  avatar,
  displayName,
}: {
  handle: string;
  avatar: string | null;
  displayName: string;
}) {
  const pathname = usePathname();
  const profileHref = `/u/${handle}`;
  const profileActive = pathname.startsWith(profileHref);

  return (
    <aside className="hidden w-[254px] shrink-0 self-stretch border-r border-border bg-card md:block md:min-h-[calc(100vh-85px)]">
      <nav className="sticky top-[85px] flex flex-col gap-2 px-4 pt-5">
        {navItems.map((item) => {
          const active =
            item.href === "/"
              ? pathname === "/"
              : pathname === item.href || pathname.startsWith(`${item.href}/`);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex h-10 items-center gap-2 rounded px-2 text-[16px] font-medium transition-colors",
                active
                  ? "bg-[hsl(var(--muted))] text-muted-foreground dark:text-app-muted"
                  : "text-muted-foreground hover:bg-[hsl(var(--muted))] dark:text-app-muted"
              )}
            >
              <item.icon size={22} weight="fill" />
              {item.label}
            </Link>
          );
        })}

        <div className="my-1 border-t border-border" />

        <Link
          href={profileHref}
          className={cn(
            "flex h-10 items-center gap-2 rounded px-2 text-[16px] font-medium transition-colors",
            profileActive
              ? "bg-[hsl(var(--muted))] text-muted-foreground dark:text-app-muted"
              : "text-muted-foreground hover:bg-[hsl(var(--muted))] dark:text-app-muted"
          )}
        >
          <div className="relative flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full bg-[#656379]">
            {avatar ? (
              <Image src={avatar} alt="" fill unoptimized className="object-cover" />
            ) : (
              <Ghost size={18} className="text-white" />
            )}
          </div>
          <span className="truncate">{displayName}</span>
        </Link>
      </nav>
    </aside>
  );
}
