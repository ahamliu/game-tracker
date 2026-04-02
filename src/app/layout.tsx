import type { Metadata } from "next";
import { IBM_Plex_Mono } from "next/font/google";
import localFont from "next/font/local";
import { and, count, eq } from "drizzle-orm";
import { connection } from "next/server";
import { auth } from "@/auth";
import { db } from "@/db";
import { notifications, users } from "@/db/schema";
import { Providers } from "@/components/providers";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { AppSidebar } from "@/components/app-sidebar";
import { Snackbar } from "@/components/snackbar";
import "./globals.css";

const ibmPlexMono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  variable: "--font-mono",
});

const gerdox = localFont({
  src: "../fonts/Gerdox-Regular.woff",
  variable: "--font-display",
  weight: "400",
});

export const metadata: Metadata = {
  title: "Playlog",
  description: "A social game tracker with content routes, character routes, ratings, and progress.",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  await connection();
  const session = await auth();

  let avatarUrl: string | null = null;
  let displayName = session?.user?.name?.trim() || session?.user?.handle || "Profile";
  let unreadCount = 0;
  if (session?.user?.id) {
    const [row, [{ c }]] = await Promise.all([
      db.query.users.findFirst({
        where: eq(users.id, session.user.id),
        columns: { avatarUrl: true, displayName: true },
      }),
      db.select({ c: count() })
        .from(notifications)
        .where(and(eq(notifications.userId, session.user.id), eq(notifications.read, false))),
    ]);
    avatarUrl = row?.avatarUrl ?? null;
    displayName =
      row?.displayName?.trim() ||
      session.user.name?.trim() ||
      session.user.handle ||
      "Profile";
    unreadCount = c;
  }

  return (
    <html lang="en" suppressHydrationWarning className={`${ibmPlexMono.variable} ${gerdox.variable}`}>
      <head>
        <link rel="stylesheet" href="https://use.typekit.net/ghy5qwe.css" />
      </head>
      <body className="min-h-screen bg-background font-sans antialiased">
        <Providers>
          <SiteHeader session={session} avatarUrl={avatarUrl} unreadCount={unreadCount} />
          <div className="flex min-h-[calc(100vh-80px)] md:min-h-[calc(100vh-85px)]">
            {session && (
              <AppSidebar
                handle={session.user.handle}
                avatar={avatarUrl}
                displayName={displayName}
              />
            )}
            <div className="flex min-w-0 flex-1 flex-col">
              <main className="min-h-0 flex-1 overflow-x-hidden px-4 pt-4 pb-[42px] md:px-6 md:pt-6">{children}</main>
              <SiteFooter signedIn={!!session?.user} handle={session?.user?.handle} />
            </div>
          </div>
          <Snackbar />
        </Providers>
      </body>
    </html>
  );
}
