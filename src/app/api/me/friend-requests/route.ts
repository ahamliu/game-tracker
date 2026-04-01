import { and, eq, or, sql } from "drizzle-orm";
import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { db } from "@/db";
import { friendRequests, friendships, notifications } from "@/db/schema";

const bodySchema = z.object({
  receiverId: z.string().uuid(),
});

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: { code: "UNAUTHORIZED" } }, { status: 401 });
  }

  const parsed = bodySchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: { code: "VALIDATION", message: parsed.error.message } }, { status: 400 });
  }

  const { receiverId } = parsed.data;
  const senderId = session.user.id;

  if (senderId === receiverId) {
    return NextResponse.json({ error: { code: "VALIDATION", message: "Cannot send a friend request to yourself" } }, { status: 400 });
  }

  const [lo, hi] = senderId < receiverId ? [senderId, receiverId] : [receiverId, senderId];
  const existingFriendship = await db.query.friendships.findFirst({
    where: and(eq(friendships.userA, lo), eq(friendships.userB, hi)),
  });
  if (existingFriendship) {
    return NextResponse.json({ error: { code: "ALREADY_FRIENDS", message: "Already friends" } }, { status: 409 });
  }

  const existingRequest = await db.query.friendRequests.findFirst({
    where: and(
      eq(friendRequests.status, "pending"),
      or(
        and(eq(friendRequests.senderId, senderId), eq(friendRequests.receiverId, receiverId)),
        and(eq(friendRequests.senderId, receiverId), eq(friendRequests.receiverId, senderId)),
      ),
    ),
  });
  if (existingRequest) {
    return NextResponse.json({ error: { code: "REQUEST_EXISTS", message: "A pending friend request already exists" } }, { status: 409 });
  }

  const [row] = await db
    .insert(friendRequests)
    .values({ senderId, receiverId })
    .onConflictDoUpdate({
      target: [friendRequests.senderId, friendRequests.receiverId],
      set: { status: "pending", updatedAt: sql`now()` },
    })
    .returning();

  await db.insert(notifications).values({
    userId: receiverId,
    type: "friend_request",
    referenceId: row.id,
    senderUserId: senderId,
  });

  return NextResponse.json({ ok: true, requestId: row.id });
}
