import { db } from "../db";
import { sql } from "drizzle-orm";
import { RouteRef } from "@/domain/types";
import { SEEDED_ROUTES } from "./routes.repository";

export interface NoticeEntity {
  id: string;
  type: string;
  severity: "info" | "warning" | "critical";
  title: string;
  body: string;
  starts_at: string;
  ends_at: string | null;
  routes: RouteRef[];
  stops: { id: string; name: string }[];
  is_auto: boolean;
}

export const SEEDED_NOTICES: NoticeEntity[] = [
  {
    id: "50000000-0000-0000-0000-000000000001",
    type: "route_change",
    severity: "warning",
    title: "Route 2 evening trips diverted via Ameerpet",
    body: "Due to emergency water pipeline repairs near Secunderabad Station, Route 2 will bypass Gandhi Hospital and divert via Ameerpet Main Road.",
    starts_at: new Date(Date.now() - 2 * 3600000).toISOString(),
    ends_at: new Date(Date.now() + 10 * 3600000).toISOString(),
    routes: [
      {
        id: "20000000-0000-0000-0000-000000000002",
        code: "R2",
        name: "Secunderabad to Campus",
        color_index: 2,
      },
    ],
    stops: [],
    is_auto: false,
  },
  {
    id: "50000000-0000-0000-0000-000000000002",
    type: "general",
    severity: "info",
    title: "Semester end examination special bus schedule",
    body: "Special morning and evening express buses will operate for all engineering departments during final examination week.",
    starts_at: new Date(Date.now() - 86400000).toISOString(),
    ends_at: new Date(Date.now() + 5 * 86400000).toISOString(),
    routes: [],
    stops: [],
    is_auto: false,
  },
];

export async function getActiveNotices(filter?: {
  route?: string;
  stop?: string;
  limit?: number;
}): Promise<NoticeEntity[]> {
  try {
    const res = await db.execute<{
      id: string;
      type: string;
      severity: string;
      title: string;
      body: string;
      starts_at: string;
      ends_at: string | null;
      is_auto: boolean;
      route_ids: string[] | null;
    }>(sql`
      SELECT
        n.id, n.type, n.severity, n.title, n.body, n.starts_at, n.ends_at, n.is_auto,
        ARRAY_AGG(DISTINCT nt.route_id) FILTER (WHERE nt.route_id IS NOT NULL) as route_ids
      FROM notices n
      LEFT JOIN notice_targets nt ON nt.notice_id = n.id
      WHERE n.is_published = true
        AND n.starts_at <= now()
        AND (n.ends_at IS NULL OR n.ends_at > now())
      GROUP BY n.id
      ORDER BY n.starts_at DESC;
    `);

    if (res.rows.length > 0) {
      const routeMap = new Map(SEEDED_ROUTES.map((r) => [r.id, r]));
      return res.rows.map((r) => {
        const routes: RouteRef[] = (r.route_ids || [])
          .map((rid) => {
            const found = routeMap.get(rid);
            return found
              ? {
                  id: found.id,
                  code: found.code,
                  name: found.name,
                  color_index: found.color_index,
                }
              : null;
          })
          .filter(Boolean) as RouteRef[];

        return {
          id: r.id,
          type: r.type,
          severity: r.severity as any,
          title: r.title,
          body: r.body,
          starts_at: r.starts_at,
          ends_at: r.ends_at,
          routes,
          stops: [],
          is_auto: r.is_auto,
        };
      });
    }
  } catch (err) {
    // Fallback
  }

  let notices = SEEDED_NOTICES;
  if (filter?.route) {
    notices = notices.filter(
      (n) => n.routes.length === 0 || n.routes.some((r) => r.code === filter.route || r.id === filter.route)
    );
  }

  return notices.slice(0, filter?.limit || 20);
}

export async function getNoticeById(id: string): Promise<NoticeEntity | null> {
  const notices = await getActiveNotices();
  return notices.find((n) => n.id === id) || null;
}
