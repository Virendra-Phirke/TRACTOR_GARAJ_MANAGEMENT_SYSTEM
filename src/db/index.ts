import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "./schema";

// Cache the DB instance to avoid re-initialization on dev hot-reload
const globalForDb = globalThis as unknown as {
  db: ReturnType<typeof drizzle> | undefined;
};

function createDb() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error("FATAL: DATABASE_URL environment variable is not set.");
  }
  const sql = neon(url);
  return drizzle(sql, { schema });
}

export const db = globalForDb.db ?? createDb();

if (process.env.NODE_ENV !== "production") {
  globalForDb.db = db;
}
