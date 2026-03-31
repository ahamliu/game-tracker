import { redirect } from "next/navigation";
import { getSessionWithUserRow } from "@/lib/auth-user";

/**
 * Protected UI runs on the Node.js runtime. Auth in Middleware runs on Edge and breaks
 * (Node `crypto` / NextAuth) — see https://nextjs.org/docs/messages/node-module-in-edge-runtime
 */
export default async function ProtectedLayout({ children }: { children: React.ReactNode }) {
  const r = await getSessionWithUserRow();
  if (!r.ok) {
    if (r.kind === "no-session") redirect("/login");
    redirect("/api/auth/sign-out-stale");
  }
  return <>{children}</>;
}
