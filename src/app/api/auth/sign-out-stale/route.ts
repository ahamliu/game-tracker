import { NextResponse } from "next/server";
import { signOut } from "@/auth";

export const dynamic = "force-dynamic";

export async function GET() {
  await signOut({ redirectTo: "/login?reason=stale-session" });
  return NextResponse.redirect(new URL("/login?reason=stale-session", process.env.AUTH_URL ?? "http://localhost:3000"));
}
