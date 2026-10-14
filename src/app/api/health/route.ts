import { NextResponse } from "next/server";
import { db } from "@/server/db";
import { sql } from "drizzle-orm";

export async function GET() {
  const timestamp = new Date().toISOString();
  let dbStatus = "unknown";

  try {
    // Quick probe to check DB connectivity
    await db.execute(sql`SELECT 1`);
    dbStatus = "ok";
  } catch (err) {
    dbStatus = err instanceof Error ? err.message : "error";
  }

  const isHealthy = dbStatus === "ok";

  return NextResponse.json(
    {
      status: isHealthy ? "ok" : "degraded",
      timestamp,
      database: dbStatus,
      app: "CollegeNav",
      version: "0.1.0",
    },
    { status: isHealthy ? 200 : 200 } // Keep 200 so monitoring sees payload with status
  );
}
