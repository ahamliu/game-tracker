import { and, eq, sql } from "drizzle-orm";
import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { db } from "@/db";
import { friendRequests, friendships, notifications } from "@/db/schema";

const bodySchema = z.object({
  action: z.enum(["accept", "decline"]),
});

type Ctx = { params: Promise<{ id: string }> };

export async function PATCH(_req: Request, ctx: Ctx) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: { code: "UNAUTHORIZED" } }, { status: 401 });
  }

  const { id } = await ctx.params;
  const parsed = bodySchema.safeParse(await _req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: { code: "VALIDATION", message: parsed.error.message } }, { status: 400 });
  }

  const request = await db.query.friendRequests.findFirst({
    where: and(eq(friendRequests.id, id), eq(friendRequests.receiverId, session.user.id)),
  });
  if (!request || request.status !== "pending") {
    return NextResponse.json({ error: { code: "NOT_FOUND", message: "Friend request not found or already handled" } }, { status: 404 });
  }

  const { action } = parsed.data;

  if (action === "accept") {
    const [lo, hi] = request.senderId < request.receiverId
      ? [request.senderId, request.receiverId]
      : [request.receiverId, request.senderId];

    await db.transaction(async (tx) => {
      await tx
        .update(friendRequests)
        .set({ status: "accepted", updatedAt: sql`now()` })
        .where(eq(friendRequests.id, id));

      await tx
        .insert(friendships)
        .values({ userA: lo, userB: hi })
        .onConflictDoNothing();

      await tx.insert(notifications).values({
        userId: request.senderId,
        type: "friend_request_accepted",
        referenceId: request.id,
        senderUserId: session.user.id,
      });
    });

    return NextResponse.json({ ok: true, status: "accepted" });
  }

  await db
    .update(friendRequests)
    .set({ status: "declined", updatedAt: sql`now()` })
    .where(eq(friendRequests.id, id));

  return NextResponse.json({ ok: true, status: "declined" });
}
