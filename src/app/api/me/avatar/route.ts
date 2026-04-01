import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { db } from "@/db";
import { users } from "@/db/schema";

const updateSchema = z.object({
  avatarUrl: z.string().url().max(2000).nullable(),
});

export async function PATCH(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }

  await db
    .update(users)
    .set({ avatarUrl: parsed.data.avatarUrl })
    .where(eq(users.id, session.user.id));

  revalidatePath("/", "layout");

  return NextResponse.json({ ok: true, avatarUrl: parsed.data.avatarUrl });
}
