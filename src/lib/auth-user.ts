import { eq } from "drizzle-orm";
import type { Session } from "next-auth";
import { auth } from "@/auth";
import { db } from "@/db";
import { users } from "@/db/schema";

/**
 * JWT sessions can outlive the DB (e.g. after `DROP SCHEMA` / reset). The token
 * still has a user id that no longer exists in `users`, which breaks FK inserts.
 */
export type SessionUserResult =
  | { ok: true; session: Session; userId: string }
  | { ok: false; kind: "no-session" }
  | { ok: false; kind: "stale-session"; session: Session };

export async function getSessionWithUserRow(): Promise<SessionUserResult> {
  const session = await auth();
  if (!session?.user?.id) return { ok: false, kind: "no-session" };
  const row = await db.query.users.findFirst({
    where: eq(users.id, session.user.id),
    columns: { id: true },
  });
  if (!row) return { ok: false, kind: "stale-session", session };
  return { ok: true, session, userId: session.user.id };
}
