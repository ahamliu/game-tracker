import { hash } from "bcryptjs";
import { eq, or } from "drizzle-orm";
import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/db";
import { users } from "@/db/schema";

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8).max(128),
  displayName: z.string().min(1).max(100),
  handle: z
    .string()
    .min(3)
    .max(32)
    .regex(/^[a-z0-9_]+$/i, "Handle: letters, numbers, underscore only"),
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const parsed = registerSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: { code: "VALIDATION", message: parsed.error.flatten() } },
        { status: 400 }
      );
    }
    const { email, password, displayName, handle } = parsed.data;
    const emailNorm = email.toLowerCase().trim();
    const handleNorm = handle.toLowerCase().trim();

    const existing = await db.query.users.findFirst({
      where: or(eq(users.email, emailNorm), eq(users.handle, handleNorm)),
    });
    if (existing) {
      return NextResponse.json(
        {
          error: {
            code: "CONFLICT",
            message:
              existing.email === emailNorm
                ? "Email already registered"
                : "Handle already taken",
          },
        },
        { status: 409 }
      );
    }

    const passwordHash = await hash(password, 12);
    await db.insert(users).values({
      email: emailNorm,
      passwordHash,
      displayName: displayName.trim(),
      handle: handleNorm,
    });

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error(e);
    return NextResponse.json(
      { error: { code: "SERVER", message: "Registration failed" } },
      { status: 500 }
    );
  }
}
