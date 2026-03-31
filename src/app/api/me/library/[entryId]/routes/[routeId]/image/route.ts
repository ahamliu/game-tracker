import { and, eq } from "drizzle-orm";
import { mkdir, writeFile } from "fs/promises";
import { NextResponse } from "next/server";
import path from "path";
import { auth } from "@/auth";
import { db } from "@/db";
import { characterRoutes, libraryEntries } from "@/db/schema";

const MAX_BYTES = 5 * 1024 * 1024;
const ALLOWED = new Set(["image/jpeg", "image/png", "image/webp"]);

type Ctx = { params: Promise<{ entryId: string; routeId: string }> };

export async function POST(req: Request, ctx: Ctx) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: { code: "UNAUTHORIZED", message: "Sign in required" } }, { status: 401 });
  }

  const { entryId, routeId } = await ctx.params;
  const entry = await db.query.libraryEntries.findFirst({
    where: and(eq(libraryEntries.id, entryId), eq(libraryEntries.userId, session.user.id)),
  });
  if (!entry) {
    return NextResponse.json({ error: { code: "NOT_FOUND", message: "Entry not found" } }, { status: 404 });
  }

  const route = await db.query.characterRoutes.findFirst({
    where: and(eq(characterRoutes.id, routeId), eq(characterRoutes.libraryEntryId, entryId)),
  });
  if (!route) {
    return NextResponse.json({ error: { code: "NOT_FOUND", message: "Route not found" } }, { status: 404 });
  }

  const form = await req.formData();
  const file = form.get("file");
  if (!file || !(file instanceof Blob)) {
    return NextResponse.json({ error: { code: "VALIDATION", message: "Missing file" } }, { status: 400 });
  }

  if (file.size > MAX_BYTES) {
    return NextResponse.json({ error: { code: "PAYLOAD", message: "File too large (max 5MB)" } }, { status: 413 });
  }

  const type = file.type;
  if (!ALLOWED.has(type)) {
    return NextResponse.json(
      { error: { code: "VALIDATION", message: "Only JPEG, PNG, or WebP allowed" } },
      { status: 400 }
    );
  }

  const ext = type === "image/png" ? "png" : type === "image/webp" ? "webp" : "jpg";
  const buf = Buffer.from(await file.arrayBuffer());

  const dir = path.join(process.cwd(), "public", "uploads", "routes", session.user.id, entryId);
  await mkdir(dir, { recursive: true });
  const filename = `${routeId}.${ext}`;
  const fsPath = path.join(dir, filename);
  await writeFile(fsPath, buf);

  const publicUrl = `/uploads/routes/${session.user.id}/${entryId}/${filename}`;

  await db.update(characterRoutes).set({ imageUrl: publicUrl }).where(eq(characterRoutes.id, routeId));

  return NextResponse.json({ imageUrl: publicUrl });
}
