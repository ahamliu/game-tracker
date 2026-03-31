import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "./schema";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error(
    "DATABASE_URL is not set. Add it to .env in the project root and restart the dev server (npm run dev)."
  );
}

const sql = neon(connectionString);
export const db = drizzle({ client: sql, schema });
