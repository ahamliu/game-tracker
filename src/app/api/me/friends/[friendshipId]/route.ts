import { and, eq, or } from "drizzle-orm";
import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/db";
import { friendships } from "@/db/schema";

type Ctx = { params: Promise<{ friendshipId: string }> };

export async function DELETE(_req: Request, ctx: Ctx) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: { code: "UNAUTHORIZED" } }, { status: 401 });
  }

  const { friendshipId } = await ctx.params;

  const row = await db.query.friendships.findFirst({
    where: and(
      eq(friendships.id, friendshipId),
      or(
        eq(friendships.userA, session.user.id),
        eq(friendships.userB, session.user.id),
      ),
    ),
  });

  if (!row) {
    return NextResponse.json({ error: { code: "NOT_FOUND" } }, { status: 404 });
  }

  await db.delete(friendships).where(eq(friendships.id, friendshipId));

  return NextResponse.json({ ok: true });
}
