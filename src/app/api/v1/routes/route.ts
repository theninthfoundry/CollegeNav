import { NextResponse } from "next/server";
import { getAllRoutes } from "@/server/repositories/routes.repository";
import { computeFreshness } from "@/domain/freshness";
import { handleApiError } from "@/lib/errors";

export async function GET() {
  try {
    const rawRoutes = await getAllRoutes();
    const now = new Date();

    const items = rawRoutes.map((r) => {
      const freshness = computeFreshness(r, now);
      return {
        id: r.id,
        code: r.code,
        name: r.name,
        color_index: r.color_index,
        status: r.status,
        status_reason: r.status_reason,
        valid_from: r.valid_from,
        valid_to: r.valid_to,
        verified_at: r.verified_at,
        freshness,
        stop_count: r.stop_count,
      };
    });

    return NextResponse.json({ items });
  } catch (error) {
    return handleApiError(error);
  }
}
