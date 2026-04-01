import { and, count, eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/db";
import { notifications } from "@/db/schema";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ count: 0 });
  }

  const [{ c }] = await db
    .select({ c: count() })
    .from(notifications)
    .where(and(eq(notifications.userId, session.user.id), eq(notifications.read, false)));

  return NextResponse.json({ count: c });
}
