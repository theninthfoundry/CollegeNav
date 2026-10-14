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
    return {
      running_trips: 4,
      live_buses: 3,
      active_notices: 2,
      routes_needing_verification: 1,
      trips_today: [
        {
          id: "trip-inst-1",
          time: "07:00",
          route_code: "R1",
          route_name: "Miyapur to Campus",
          bus_reg: "TS09 UB 1001",
          driver_name: "Ravi Kumar",
          status: "running",
          tracking: "live",
          delay_min: 0,
        },
        {
          id: "trip-inst-2",
          time: "07:15",
          route_code: "R2",
          route_name: "Kukatpally to Campus",
          bus_reg: "TS09 UB 1002",
          driver_name: "Suresh Reddy",
          status: "running",
          tracking: "live",
          delay_min: 4,
        },
        {
          id: "trip-inst-3",
          time: "07:30",
          route_code: "R3",
          route_name: "Secunderabad Express",
          bus_reg: "TS09 UB 1003",
          driver_name: "Mohan Lal",
          status: "delayed",
          tracking: "stale",
          delay_min: 12,
        },
        {
          id: "trip-inst-4",
          time: "08:00",
          route_code: "R4",
          route_name: "Gachibowli Shuttle",
          bus_reg: "TS09 UB 1004",
          driver_name: "Venkatesh",
          status: "scheduled",
          tracking: "not_tracked",
          delay_min: 0,
        },
      ],
      routes_status: [
        {
          id: "20000000-0000-0000-0000-000000000003",
          code: "R3",
          name: "Secunderabad Express",
          last_verified: "14 days ago",
          freshness: "aging",
        },
        {
          id: "20000000-0000-0000-0000-000000000004",
          code: "R4",
          name: "Gachibowli Shuttle",
          last_verified: "52 days ago",
          freshness: "outdated",
        },
      ],
    };
  },

  // Today's Operations
  async getOperationsToday() {
    return [
      {
        id: "inst-op-1",
        trip_id: "trip-r1-1",
        route_code: "R1",
        direction: "to_campus",
        scheduled_time: "07:00 am",
        bus_reg: "TS09 UB 1001",
        driver_name: "Ravi Kumar",
        status: "running",
        delay_min: 0,
        tracking: "live",
      },
      {
        id: "inst-op-2",
        trip_id: "trip-r2-1",
        route_code: "R2",
        direction: "to_campus",
        scheduled_time: "07:15 am",
        bus_reg: "TS09 UB 1002",
        driver_name: "Suresh Reddy",
        status: "delayed",
        delay_min: 8,
        tracking: "live",
      },
      {
        id: "inst-op-3",
        trip_id: "trip-r3-1",
        route_code: "R3",
        direction: "to_campus",
        scheduled_time: "07:30 am",
        bus_reg: "TS09 UB 1003",
        driver_name: "Mohan Lal",
        status: "scheduled",
        delay_min: 0,
        tracking: "scheduled",
      },
      {
        id: "inst-op-4",
        trip_id: "trip-r4-1",
        route_code: "R4",
        direction: "to_campus",
        scheduled_time: "08:00 am",
        bus_reg: "TS09 UB 1004",
        driver_name: "Venkatesh",
        status: "cancelled",
        delay_min: 0,
        tracking: "not_tracked",
        cancel_reason: "Bus engine maintenance",
      },
    ];
  },

  // Cancel trip instance
  async cancelTrip(id: string, reason: string, notify: boolean, actorId?: string) {
    await this.recordAudit({
      actorId,
      action: "cancel_trip",
      entity: "trip_instance",
      entityId: id,
      summary: `Cancelled trip instance ${id}: ${reason}`,
      before: { status: "scheduled" },
      after: { status: "cancelled", reason, notify },
    });
    return { success: true, id, status: "cancelled", notice_drafted: notify };
  },

  // Delay trip instance
  async delayTrip(id: string, delayMin: number, reason: string, notify: boolean, actorId?: string) {
    await this.recordAudit({
      actorId,
      action: "delay_trip",
      entity: "trip_instance",
      entityId: id,
      summary: `Delayed trip instance ${id} by ${delayMin} min: ${reason}`,
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
