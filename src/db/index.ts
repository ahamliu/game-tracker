import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as schema from "./schema";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error(
    "DATABASE_URL is not set. Add it to .env in the project root and restart the dev server (npm run dev)."
  );
}

const pool = new pg.Pool({
  connectionString,
  max: 10,
});

export const db = drizzle(pool, { schema });
