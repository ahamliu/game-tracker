import { count, eq, or } from "drizzle-orm";
import { NextResponse } from "next/server";
import { db } from "@/db";
import { friendships, users } from "@/db/schema";

type Ctx = { params: Promise<{ handle: string }> };

export async function GET(_req: Request, ctx: Ctx) {
  const { handle } = await ctx.params;
  const h = handle.toLowerCase().trim();

  const user = await db.query.users.findFirst({ where: eq(users.handle, h) });
  if (!user) {
    return NextResponse.json({ error: { code: "NOT_FOUND", message: "User not found" } }, { status: 404 });
  }

  const [{ fc }] = await db
    .select({ fc: count() })
    .from(friendships)
    .where(or(eq(friendships.userA, user.id), eq(friendships.userB, user.id)));

  return NextResponse.json({
    user: {
      displayName: user.displayName,
      handle: user.handle,
      bio: user.bio,
      avatarUrl: user.avatarUrl,
    },
    stats: { friends: fc },
  });
}
