import { and, eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/db";
import { follows, users } from "@/db/schema";

type Ctx = { params: Promise<{ handle: string }> };

async function resolveUser(handle: string) {
  return db.query.users.findFirst({ where: eq(users.handle, handle.toLowerCase().trim()) });
}

export async function POST(_req: Request, ctx: Ctx) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: { code: "UNAUTHORIZED", message: "Sign in required" } }, { status: 401 });
  }

  const { handle } = await ctx.params;
  const target = await resolveUser(handle);
  if (!target) {
    return NextResponse.json({ error: { code: "NOT_FOUND", message: "User not found" } }, { status: 404 });
  }

  if (target.id === session.user.id) {
    return NextResponse.json({ error: { code: "VALIDATION", message: "Cannot follow yourself" } }, { status: 400 });
  }

  const existing = await db.query.follows.findFirst({
    where: and(eq(follows.followerId, session.user.id), eq(follows.followingId, target.id)),
  });
  if (existing) {
    return NextResponse.json({ ok: true, following: true });
  }

  await db.insert(follows).values({ followerId: session.user.id, followingId: target.id });
  return NextResponse.json({ ok: true, following: true });
}

export async function DELETE(_req: Request, ctx: Ctx) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: { code: "UNAUTHORIZED", message: "Sign in required" } }, { status: 401 });
  }

  const { handle } = await ctx.params;
  const target = await resolveUser(handle);
  if (!target) {
    return NextResponse.json({ error: { code: "NOT_FOUND", message: "User not found" } }, { status: 404 });
  }

  await db
    .delete(follows)
    .where(and(eq(follows.followerId, session.user.id), eq(follows.followingId, target.id)));

  return NextResponse.json({ ok: true, following: false });
}
