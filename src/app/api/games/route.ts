import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { createUserSubmittedGame, findSimilarTitles } from "@/lib/catalog";

const bodySchema = z.object({
  title: z.string().min(1).max(500),
  coverUrl: z.string().url().optional().nullable(),
  confirmNotDuplicate: z.boolean().optional(),
});

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: { code: "UNAUTHORIZED", message: "Sign in required" } }, { status: 401 });
  }

  const json = await req.json().catch(() => null);
  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { error: { code: "VALIDATION", message: parsed.error.flatten() } },
      { status: 400 }
    );
  }

  const { title, coverUrl, confirmNotDuplicate } = parsed.data;
  const similar = await findSimilarTitles(title);
  const hasSimilar = similar.some(
    (s) => s.title.toLowerCase() === title.trim().toLowerCase()
  );

  if (similar.length > 0 && !confirmNotDuplicate) {
    return NextResponse.json({
      warning: "similar",
      similar: similar.map((s) => ({ id: s.id, title: s.title })),
    });
  }

  const game = await createUserSubmittedGame({
    title,
    coverUrl: coverUrl ?? null,
    userId: session.user.id,
  });

  if (!game) {
    return NextResponse.json(
      { error: { code: "SERVER", message: "Could not create game" } },
      { status: 500 }
    );
  }

  return NextResponse.json({ game, duplicateExact: hasSimilar });
}
