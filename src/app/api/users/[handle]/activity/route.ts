import { desc, eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { db } from "@/db";
import { activities, users } from "@/db/schema";

type Ctx = { params: Promise<{ handle: string }> };

export async function GET(req: Request, ctx: Ctx) {
  const { handle } = await ctx.params;
  const h = handle.toLowerCase().trim();

  const user = await db.query.users.findFirst({ where: eq(users.handle, h) });
  if (!user) {
    return NextResponse.json({ error: { code: "NOT_FOUND", message: "User not found" } }, { status: 404 });
  }

  const { searchParams } = new URL(req.url);
  const limit = Math.min(50, Math.max(1, Number(searchParams.get("limit")) || 20));

  const rows = await db.query.activities.findMany({
    where: eq(activities.userId, user.id),
    orderBy: [desc(activities.createdAt)],
    limit,
  });

  return NextResponse.json({ activities: rows });
}
