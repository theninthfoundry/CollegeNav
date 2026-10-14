import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as schema from "./schema";
import { env } from "@/lib/env";

const { Pool } = pg;

const pool = new Pool({
  connectionString: env.DATABASE_URL,
  max: 10,
  idleTimeoutMillis: 30000,
});

export const db = drizzle(pool, { schema });
