import Link from "next/link";
import {
  BookmarkSimple,
  House,
  SignIn,
  UserCircle,
  UserPlus,
} from "@phosphor-icons/react/dist/ssr";

type FooterLink = {
  href: string;
  label: string;
  icon: React.ElementType;
};

export function SiteFooter({
  signedIn,
  handle,
}: {
  signedIn: boolean;
  handle?: string;
}) {
  const navLinks: FooterLink[] = signedIn
    ? [
        { href: "/", label: "Home", icon: House },
        { href: "/library", label: "My Library", icon: BookmarkSimple },
        { href: handle ? `/u/${handle}` : "/library", label: "Profile", icon: UserCircle },
      ]
    : [
        { href: "/", label: "Home", icon: House },
        { href: "/login", label: "Sign In", icon: SignIn },
        { href: "/register", label: "Create Account", icon: UserPlus },
      ];

  return (
    <footer className="bg-card">
      <div className="mx-auto max-w-[1380px] px-4 py-10 md:px-6 md:py-12">
        <div className="flex flex-col items-start gap-8 md:flex-row md:items-start md:gap-12">
          <div className="space-y-4">
            <div className="space-y-2">
              <span
                aria-label="PlayLog"
                className="block h-7 w-[100px] bg-app-muted md:h-8"
                style={{
                  WebkitMaskImage: "url('/logo.svg')",
                  maskImage: "url('/logo.svg')",
                  WebkitMaskRepeat: "no-repeat",
                  maskRepeat: "no-repeat",
                  WebkitMaskPosition: "center",
                  maskPosition: "center",
                  WebkitMaskSize: "contain",
                  maskSize: "contain",
                }}
              />
              <p className="text-[12px] text-muted-foreground">
                Track games, routes, ratings, and all the little notes worth keeping.
              </p>
            </div>
          </div>

          <div className="shrink-0">
            <h2 className="mb-3 font-mono text-[12px] font-semibold uppercase tracking-[0.18em] text-app-muted">
              Navigate
            </h2>
            <div className="space-y-2">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="flex items-center gap-2 text-[14px] text-muted-foreground transition-colors hover:text-app-muted"
                >
                  <link.icon size={16} weight="bold" />
                  {link.label}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
