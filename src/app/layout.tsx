import type { Metadata } from "next";
import { Poppins, IBM_Plex_Mono } from "next/font/google";
import localFont from "next/font/local";
import { auth } from "@/auth";
import { Providers } from "@/components/providers";
import { SiteHeader } from "@/components/site-header";
import { AppSidebar } from "@/components/app-sidebar";
import "./globals.css";

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["400", "500", "700"],
  variable: "--font-sans",
});

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
  title: "PlayLog — track games & character routes",
  description: "A modern game list tracker with otome-style routes, ratings, and progress.",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await auth();

  return (
    <html lang="en" suppressHydrationWarning className={`${poppins.variable} ${ibmPlexMono.variable} ${gerdox.variable}`}>
      <body className={`min-h-screen bg-background font-sans antialiased ${poppins.className}`}>
        <Providers>
          <SiteHeader session={session} />
          <div className="flex">
            {session && <AppSidebar />}
            <main className="min-h-[calc(100vh-85px)] flex-1 overflow-y-auto px-6 py-6">{children}</main>
          </div>
        </Providers>
      </body>
    </html>
  );
}
