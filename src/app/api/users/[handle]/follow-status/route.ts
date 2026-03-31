import { and, eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/db";
import { follows, users } from "@/db/schema";

type Ctx = { params: Promise<{ handle: string }> };

/** Whether the current user follows this handle (auth only). */
export async function GET(_req: Request, ctx: Ctx) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ following: false });
  }

  const { handle } = await ctx.params;
  const target = await db.query.users.findFirst({
    where: eq(users.handle, handle.toLowerCase().trim()),
  });
  if (!target) {
    return NextResponse.json({ error: { code: "NOT_FOUND", message: "User not found" } }, { status: 404 });
  }

  const row = await db.query.follows.findFirst({
    where: and(eq(follows.followerId, session.user.id), eq(follows.followingId, target.id)),
  });

  return NextResponse.json({ following: !!row });
}
