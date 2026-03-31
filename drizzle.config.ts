import { config } from "dotenv";
import { defineConfig } from "drizzle-kit";

// drizzle-kit does not load .env by default; Next.js does for the app
config({ path: ".env" });
config({ path: ".env.local", override: true });

const url = process.env.DATABASE_URL;
if (!url) {
  throw new Error(
    'DATABASE_URL is missing. Create a .env file in the project root (copy from .env.example) and set DATABASE_URL=postgresql://...'
  );
}

export default defineConfig({
  schema: "./src/db/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    url,
  },
});
