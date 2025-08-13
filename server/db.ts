// server/db.ts
import "dotenv/config";
import { Pool } from "pg";
import { drizzle } from "drizzle-orm/node-postgres";
import * as schema from "@shared/schema";

// Build a single connection string (prefer DATABASE_URL)
const connectionString =
  process.env.DATABASE_URL ??
  `postgresql://${process.env.PGUSER}:${process.env.PGPASSWORD}` +
  `@${process.env.PGHOST ?? "127.0.0.1"}:${process.env.PGPORT ?? "5432"}/${process.env.PGDATABASE}`;

// Optional flag to enable SSL only if your server actually supports it
const sslEnabled = (process.env.DATABASE_SSL || "").toLowerCase() === "true";

export const pool = new Pool({
  connectionString,
  ssl: sslEnabled ? { rejectUnauthorized: false } : undefined,
});

// One Drizzle client for the whole app
export const db = drizzle(pool, { schema });
