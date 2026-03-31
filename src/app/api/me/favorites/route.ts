import { eq, inArray } from "drizzle-orm";
import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { db } from "@/db";
import { games, libraryEntries, users } from "@/db/schema";

const patchSchema = z.object({
  gameIds: z.array(z.string().uuid()).max(5),
});

export async function PATCH(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json(
      { error: { code: "UNAUTHORIZED", message: "Sign in required" } },
      { status: 401 }
    );
  }

  const body = await req.json();
  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: { code: "INVALID_INPUT", message: parsed.error.message } },
      { status: 400 }
    );
  }

  const { gameIds } = parsed.data;

  if (gameIds.length > 0) {
    const userEntries = await db
      .select({ gameId: libraryEntries.gameId })
      .from(libraryEntries)
      .where(eq(libraryEntries.userId, session.user.id));

    const userGameIds = new Set(userEntries.map((e) => e.gameId));
    const validIds = gameIds.filter((id) => userGameIds.has(id));

    const existingGames = await db
      .select({ id: games.id })
      .from(games)
      .where(inArray(games.id, validIds));

    const existingSet = new Set(existingGames.map((g) => g.id));
    const finalIds = validIds.filter((id) => existingSet.has(id));

    await db
      .update(users)
      .set({ favoriteGameIds: finalIds, updatedAt: new Date() })
      .where(eq(users.id, session.user.id));

    return NextResponse.json({ favoriteGameIds: finalIds });
  }

  await db
    .update(users)
    .set({ favoriteGameIds: [], updatedAt: new Date() })
    .where(eq(users.id, session.user.id));

  return NextResponse.json({ favoriteGameIds: [] });
}
