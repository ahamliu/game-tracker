"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Compass, BookmarkSimple } from "@phosphor-icons/react";
import { cn } from "@/lib/utils";

type NavItem = {
  label: string;
  href: string;
  icon: React.ElementType;
};

const navItems: NavItem[] = [
  { label: "Explore", href: "/", icon: Compass },
  { label: "Library", href: "/library", icon: BookmarkSimple },
];

export function AppSidebar() {
  const pathname = usePathname();

  return (
    <aside className="sticky top-[85px] hidden h-[calc(100vh-85px)] w-[254px] shrink-0 border-r border-border bg-card md:block">
      <nav className="flex flex-col gap-2 px-4 pt-5">
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
                  ? "bg-[hsl(var(--muted))] text-foreground"
                  : "text-muted-foreground hover:bg-[hsl(var(--muted))] hover:text-foreground"
              )}
              style={{ color: "hsl(249,1%,42%)" }}
            >
              <item.icon size={20} />
              {item.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
