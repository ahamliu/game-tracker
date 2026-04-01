import { desc, eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/db";
import { notifications, users } from "@/db/schema";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: { code: "UNAUTHORIZED" } }, { status: 401 });
  }

  const rows = await db
    .select({
      id: notifications.id,
      type: notifications.type,
      referenceId: notifications.referenceId,
      read: notifications.read,
      createdAt: notifications.createdAt,
      senderHandle: users.handle,
      senderDisplayName: users.displayName,
      senderAvatarUrl: users.avatarUrl,
    })
    .from(notifications)
    .leftJoin(users, eq(notifications.senderUserId, users.id))
    .where(eq(notifications.userId, session.user.id))
    .orderBy(desc(notifications.createdAt))
    .limit(30);

  return NextResponse.json({ notifications: rows });
}
