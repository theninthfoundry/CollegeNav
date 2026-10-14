import { db } from "@/server/db";
import {
  stops,
  routes,
  routeStops,
  trips,
  tripInstances,
  buses,
  drivers,
  notices,
  noticeTargets,
  auditLog,
  settings,
  profiles,
} from "@/server/schema";
import { eq, desc, and, sql } from "drizzle-orm";
import { RAW_CAMPUS_BUS_ROUTES, FLEET_ROUTES, FLEET_DRIVERS } from "@/server/bus-data";

export interface AuditEntry {
  id?: number;
  actorId?: string | null;
  action: string;
  entity: string;
  entityId?: string | null;
  summary: string;
  before?: any;
  after?: any;
}

export interface OperationTripItem {
  id: string;
  trip_id: string;
  route_no: number;
  route_code: string;
  route_name: string;
  direction: "to_campus" | "from_campus";
  scheduled_time: string;
  bus_reg: string;
  driver_name: string;
  driver_phone: string;
  corridor: string;
  origin: string;
  destination: string;
  status: "running" | "delayed" | "scheduled" | "cancelled";
  delay_min: number;
  tracking: "live" | "estimated" | "scheduled" | "not_tracked";
  cancel_reason?: string;
  delay_reason?: string;
  stops_count: number;
  next_stop?: string;
}

// In-memory fallback audit log for offline dev/demo
let inMemoryAuditLog: Array<{
  id: number;
  at: string;
  actor_id: string | null;
  action: string;
  entity: string;
  entity_id: string | null;
  summary: string;
  before: any;
  after: any;
}> = [
  {
    id: 1,
    at: new Date(Date.now() - 3600000).toISOString(),
    actor_id: "00000000-0000-0000-0000-000000000001",
    action: "verify",
    entity: "route",
    entity_id: "20000000-0000-0000-0000-000000000001",
    summary: "Marked Route 1 (R1) as verified for Autumn Semester",
    before: { verified_at: null },
    after: { verified_at: new Date().toISOString() },
  },
  {
    id: 2,
    at: new Date(Date.now() - 1800000).toISOString(),
    actor_id: "00000000-0000-0000-0000-000000000001",
    action: "create",
    entity: "notice",
    entity_id: "50000000-0000-0000-0000-000000000001",
    summary: "Published Route 3 diversion advisory due to flyover construction",
    before: null,
    after: { title: "Route 3 diverted via Ring Road", severity: "warning" },
  },
];

// In-memory operations state for all 54 routes initialized from official fleet data
let inMemoryOperations: OperationTripItem[] = RAW_CAMPUS_BUS_ROUTES.map((raw) => {
  const routeNo = raw.route_no;
  let status: OperationTripItem["status"] = "scheduled";
  let delayMin = 0;
  let tracking: OperationTripItem["tracking"] = "scheduled";
  let cancelReason: string | undefined = undefined;

  if (routeNo === 4) {
    status = "cancelled";
    cancelReason = "Maintenance: Scheduled engine inspection";
    tracking = "not_tracked";
  } else if (routeNo === 3 || routeNo === 14 || routeNo === 28) {
    status = "delayed";
    delayMin = routeNo === 3 ? 12 : routeNo === 14 ? 8 : 15;
    tracking = "live";
  } else if (routeNo <= 25) {
    status = "running";
    tracking = "live";
  } else if (routeNo <= 40) {
    status = "running";
    tracking = "live";
  } else {
    status = "scheduled";
    tracking = "scheduled";
  }

  const origin = raw.stops && raw.stops.length > 0 ? raw.stops[0] : "Origin";
  const nextStop =
    raw.stops && raw.stops.length > 2
      ? raw.stops[Math.min(2, raw.stops.length - 1)]
      : raw.stops[1] || "College Campus";

  return {
    id: `inst-op-${routeNo}`,
    trip_id: `trip-r${routeNo}-1`,
    route_no: routeNo,
    route_code: raw.code,
    route_name: `${origin} to Campus`,
    direction: "to_campus",
    scheduled_time: `${raw.depart_time} AM`,
    bus_reg: `TS09 UB ${1000 + routeNo}`,
    driver_name: raw.driver_name,
    driver_phone: raw.driver_phone,
    corridor: raw.corridor,
    origin,
    destination: "College Campus",
    status,
    delay_min: delayMin,
    tracking,
    cancel_reason: cancelReason,
    stops_count: raw.stops ? raw.stops.length : 0,
    next_stop: nextStop,
  };
});

export const adminRepository = {
  // Record audit log
  async recordAudit(entry: AuditEntry) {
    try {
      if (db) {
        await db.insert(auditLog).values({
          actorId: entry.actorId || undefined,
          action: entry.action,
          entity: entry.entity,
          entityId: entry.entityId || undefined,
          summary: entry.summary,
          before: entry.before,
          after: entry.after,
        });
      }
    } catch {
      // Fallback in-memory
    }

    inMemoryAuditLog.unshift({
      id: inMemoryAuditLog.length + 1,
      at: new Date().toISOString(),
      actor_id: entry.actorId || "00000000-0000-0000-0000-000000000001",
      action: entry.action,
      entity: entry.entity,
      entity_id: entry.entityId || null,
      summary: entry.summary,
      before: entry.before,
      after: entry.after,
    });
  },

  // Get audit log
  async getAuditLog(limit = 50) {
    try {
      if (db) {
        const rows = await db
          .select()
          .from(auditLog)
          .orderBy(desc(auditLog.at))
          .limit(limit);
        if (rows.length > 0) {
          return rows.map((r) => ({
            id: r.id,
            at: r.at ? r.at.toISOString() : new Date().toISOString(),
            actor_id: r.actorId,
            action: r.action,
            entity: r.entity,
            entity_id: r.entityId,
            summary: r.summary || "",
            before: r.before,
            after: r.after,
          }));
        }
      }
    } catch {
      // Return in-memory
    }
    return inMemoryAuditLog.slice(0, limit);
  },

  // Get Dashboard stats
  async getDashboard() {
    const running = inMemoryOperations.filter((t) => t.status === "running").length;
    const delayed = inMemoryOperations.filter((t) => t.status === "delayed").length;
    const live = inMemoryOperations.filter((t) => t.tracking === "live").length;

    return {
      total_routes: 54,
      running_trips: running,
      live_buses: live,
      active_notices: 2,
      routes_needing_verification: 2,
      trips_today: inMemoryOperations.slice(0, 8).map((op) => ({
        id: op.id,
        time: op.scheduled_time.replace(" AM", ""),
        route_code: op.route_code,
        route_name: op.route_name,
        bus_reg: op.bus_reg,
        driver_name: op.driver_name,
        status: op.status,
        tracking: op.tracking,
        delay_min: op.delay_min,
      })),
      routes_status: [
        {
          id: "20000000-0000-0000-0000-000000000003",
          code: "R3",
          name: "Indira Park to Campus",
          last_verified: "14 days ago",
          freshness: "aging",
        },
        {
          id: "20000000-0000-0000-0000-000000000021",
          code: "R21",
          name: "Niranjan to Campus",
          last_verified: "52 days ago",
          freshness: "outdated",
        },
      ],
    };
  },

  // Today's Operations for all 54 routes
  async getOperationsToday(): Promise<OperationTripItem[]> {
    return [...inMemoryOperations];
  },

  // Cancel trip instance
  async cancelTrip(id: string, reason: string, notify: boolean, actorId?: string) {
    const target = inMemoryOperations.find((t) => t.id === id);
    if (target) {
      target.status = "cancelled";
      target.cancel_reason = reason;
      target.tracking = "not_tracked";
    }

    await this.recordAudit({
      actorId,
      action: "cancel_trip",
      entity: "trip_instance",
      entityId: id,
      summary: `Cancelled trip instance ${id} (${target?.route_code || "Fleet"}): ${reason}`,
      before: { status: "scheduled" },
      after: { status: "cancelled", reason, notify },
    });
    return { success: true, id, status: "cancelled", notice_drafted: notify };
  },

  // Delay trip instance
  async delayTrip(id: string, delayMin: number, reason: string, notify: boolean, actorId?: string) {
    const target = inMemoryOperations.find((t) => t.id === id);
    if (target) {
      target.status = "delayed";
      target.delay_min = delayMin;
      target.delay_reason = reason;
      target.tracking = "live";
    }

    await this.recordAudit({
      actorId,
      action: "delay_trip",
      entity: "trip_instance",
      entityId: id,
      summary: `Delayed trip instance ${id} (${target?.route_code || "Fleet"}) by ${delayMin} min: ${reason}`,
      before: { delay_min: 0 },
      after: { delay_min: delayMin, reason, notify },
    });
    return { success: true, id, delay_min: delayMin, status: "delayed", notice_drafted: notify };
  },

  // Verify route
  async verifyRoute(routeId: string, actorId?: string) {
    await this.recordAudit({
      actorId,
      action: "verify_route",
      entity: "route",
      entityId: routeId,
      summary: `Verified route timetable and stop sequence for ${routeId}`,
      before: { verified_at: null },
      after: { verified_at: new Date().toISOString() },
    });
    return { success: true, route_id: routeId, verified_at: new Date().toISOString() };
  },

  // Suspend route
  async suspendRoute(routeId: string, reason: string, actorId?: string) {
    await this.recordAudit({
      actorId,
      action: "suspend_route",
      entity: "route",
      entityId: routeId,
      summary: `Suspended route ${routeId}: ${reason}`,
      before: { status: "active" },
      after: { status: "suspended", reason },
    });
    return { success: true, route_id: routeId, status: "suspended" };
  },

  // Resume route
  async resumeRoute(routeId: string, actorId?: string) {
    await this.recordAudit({
      actorId,
      action: "resume_route",
      entity: "route",
      entityId: routeId,
      summary: `Resumed route ${routeId} to active operation`,
      before: { status: "suspended" },
      after: { status: "active" },
    });
    return { success: true, route_id: routeId, status: "active" };
  },
};
