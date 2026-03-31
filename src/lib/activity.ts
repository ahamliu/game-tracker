import { db } from "@/db";
import { activities } from "@/db/schema";

export type ActivityType = "completed" | "started" | "rated" | "dropped" | "on_hold";

export async function logActivity(
  userId: string,
  type: ActivityType,
  payload: Record<string, unknown>,
  libraryEntryId?: string | null
) {
  await db.insert(activities).values({
    userId,
    type,
    payload,
    libraryEntryId: libraryEntryId ?? null,
  });
}
