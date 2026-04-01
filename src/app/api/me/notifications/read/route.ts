import { and, eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/db";
import { notifications } from "@/db/schema";

export async function PATCH() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: { code: "UNAUTHORIZED" } }, { status: 401 });
  }

  await db
    .update(notifications)
    .set({ read: true })
    .where(and(eq(notifications.userId, session.user.id), eq(notifications.read, false)));

  return NextResponse.json({ ok: true });
}
