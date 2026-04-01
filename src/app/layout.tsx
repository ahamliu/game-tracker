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
  title: "PlayLog — track games, routes & more",
  description: "A modern game list tracker with otome-style routes, ratings, and progress.",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  await connection();
  const session = await auth();

  let avatarUrl: string | null = null;
  let unreadCount = 0;
  if (session?.user?.id) {
    const [row, [{ c }]] = await Promise.all([
      db.query.users.findFirst({
        where: eq(users.id, session.user.id),
        columns: { avatarUrl: true },
      }),
      db.select({ c: count() })
        .from(notifications)
        .where(and(eq(notifications.userId, session.user.id), eq(notifications.read, false))),
    ]);
    avatarUrl = row?.avatarUrl ?? null;
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
          <div className="flex">
            {session && <AppSidebar handle={session.user.handle} avatar={avatarUrl} />}
            <main className="min-h-[calc(100vh-85px)] flex-1 overflow-y-auto px-6 pt-6 pb-[42px]">{children}</main>
          </div>
          <Snackbar />
        </Providers>
      </body>
    </html>
  );
}
