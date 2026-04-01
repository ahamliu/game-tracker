import { eq, or } from "drizzle-orm";
import { NextResponse } from "next/server";
import { db } from "@/db";
import { friendships, users } from "@/db/schema";

type Ctx = { params: Promise<{ handle: string }> };

export async function GET(_req: Request, ctx: Ctx) {
  const { handle } = await ctx.params;
  const h = handle.toLowerCase().trim();

  const user = await db.query.users.findFirst({ where: eq(users.handle, h) });
  if (!user) {
    return NextResponse.json({ error: { code: "NOT_FOUND" } }, { status: 404 });
  }

  const rows = await db
    .select({
      friendshipId: friendships.id,
      userA: friendships.userA,
      userB: friendships.userB,
    })
    .from(friendships)
    .where(or(eq(friendships.userA, user.id), eq(friendships.userB, user.id)));

  const friendUserIds = rows.map((r) =>
    r.userA === user.id ? r.userB : r.userA
  );

  if (friendUserIds.length === 0) {
    return NextResponse.json({ friends: [] });
  }

  const friendUsers = await db.query.users.findMany({
    where: (u, { inArray }) => inArray(u.id, friendUserIds),
    columns: { id: true, handle: true, displayName: true, avatarUrl: true },
  });

  return NextResponse.json({ friends: friendUsers });
}
