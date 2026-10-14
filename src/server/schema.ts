import {
  pgTable,
  uuid,
  text,
  smallint,
  integer,
  real,
  bigserial,
  boolean,
  date,
  time,
  timestamp,
  jsonb,
  pgEnum,
  customType,
  primaryKey,
} from "drizzle-orm/pg-core";

// Enums
export const userRoleEnum = pgEnum("user_role", ["student", "admin", "super_admin"]);
export const directionEnum = pgEnum("direction", ["to_campus", "from_campus"]);
export const routeStatusEnum = pgEnum("route_status", ["active", "suspended", "archived"]);
export const runStatusEnum = pgEnum("run_status", ["scheduled", "running", "completed", "cancelled"]);
export const noticeTypeEnum = pgEnum("notice_type", [
  "delay",
  "cancellation",
  "route_change",
  "stop_change",
  "schedule_change",
  "general",
]);
export const noticeSeverityEnum = pgEnum("notice_severity", ["info", "warning", "critical"]);
export const delaySourceEnum = pgEnum("delay_source", ["admin", "driver", "live"]);

// Custom types for PostGIS
export const pointGeography = customType<{ data: { lat: number; lng: number }; driverData: string }>({
  dataType() {
    return "geography(Point, 4326)";
  },
  toDriver(value: { lat: number; lng: number }) {
    return `SRID=4326;POINT(${value.lng} ${value.lat})`;
  },
  fromDriver(value: unknown) {
    if (typeof value === "object" && value !== null && "coordinates" in (value as any)) {
      const coords = (value as any).coordinates;
      return { lng: coords[0], lat: coords[1] };
    }
    return { lat: 0, lng: 0 };
  },
});

export const lineGeography = customType<{ data: [number, number][]; driverData: string }>({
  dataType() {
    return "geography(LineString, 4326)";
  },
  toDriver(value: [number, number][]) {
    const pts = value.map(([lng, lat]) => `${lng} ${lat}`).join(", ");
    return `SRID=4326;LINESTRING(${pts})`;
  },
  fromDriver(value: unknown) {
    if (typeof value === "object" && value !== null && "coordinates" in (value as any)) {
      return (value as any).coordinates;
    }
    return [];
  },
});

// Settings
export const settings = pgTable("settings", {
  key: text("key").primaryKey(),
  value: jsonb("value").notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

// Profiles
export const profiles = pgTable("profiles", {
  id: uuid("id").primaryKey(),
  displayName: text("display_name"),
  role: userRoleEnum("role").notNull().default("student"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

// Stops
export const stops = pgTable("stops", {
  id: uuid("id").primaryKey().defaultRandom(),
  code: text("code").unique(),
  name: text("name").notNull(),
  geom: pointGeography("geom").notNull(),
  landmark: text("landmark"),
  stepFree: boolean("step_free"),
  isCampus: boolean("is_campus").notNull().default(false),
  isActive: boolean("is_active").notNull().default(true),
  inactiveReason: text("inactive_reason"),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

// Stop aliases
export const stopAliases = pgTable("stop_aliases", {
  id: uuid("id").primaryKey().defaultRandom(),
  stopId: uuid("stop_id")
    .notNull()
    .references(() => stops.id, { onDelete: "cascade" }),
  alias: text("alias").notNull(),
});

// Routes
export const routes = pgTable("routes", {
  id: uuid("id").primaryKey().defaultRandom(),
  code: text("code").notNull().unique(),
  name: text("name").notNull(),
  colorIndex: smallint("color_index").notNull(),
  status: routeStatusEnum("status").notNull().default("active"),
  statusReason: text("status_reason"),
  validFrom: date("valid_from"),
  validTo: date("valid_to"),
  verifiedAt: timestamp("verified_at", { withTimezone: true }),
  verifiedBy: uuid("verified_by").references(() => profiles.id),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

// Route directions
export const routeDirections = pgTable(
  "route_directions",
  {
    routeId: uuid("route_id")
      .notNull()
      .references(() => routes.id, { onDelete: "cascade" }),
    direction: directionEnum("direction").notNull(),
    line: lineGeography("line"),
    lengthM: integer("length_m"),
  },
  (table) => [primaryKey({ columns: [table.routeId, table.direction] })]
);

// Route stops
export const routeStops = pgTable(
  "route_stops",
  {
    routeId: uuid("route_id").notNull(),
    direction: directionEnum("direction").notNull(),
    seq: smallint("seq").notNull(),
    stopId: uuid("stop_id")
      .notNull()
      .references(() => stops.id),
    offsetMin: smallint("offset_min").notNull(),
    dwellS: smallint("dwell_s").notNull().default(30),
    progressM: integer("progress_m"),
  },
  (table) => [primaryKey({ columns: [table.routeId, table.direction, table.seq] })]
);

// Buses
export const buses = pgTable("buses", {
  id: uuid("id").primaryKey().defaultRandom(),
  regNo: text("reg_no").notNull().unique(),
  name: text("name"),
  capacity: smallint("capacity"),
  defaultRouteId: uuid("default_route_id").references(() => routes.id),
  status: text("status").notNull().default("active"),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

// Drivers
export const drivers = pgTable("drivers", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  phone: text("phone"),
  busId: uuid("bus_id").references(() => buses.id),
  codeHash: text("code_hash").notNull(),
  isActive: boolean("is_active").notNull().default(true),
});

// Trips
export const trips = pgTable("trips", {
  id: uuid("id").primaryKey().defaultRandom(),
  routeId: uuid("route_id")
    .notNull()
    .references(() => routes.id),
  direction: directionEnum("direction").notNull(),
  departTime: time("depart_time").notNull(),
  days: smallint("days").notNull(),
  busId: uuid("bus_id").references(() => buses.id),
  validFrom: date("valid_from"),
  validTo: date("valid_to"),
  isActive: boolean("is_active").notNull().default(true),
  verifiedAt: timestamp("verified_at", { withTimezone: true }),
  verifiedBy: uuid("verified_by").references(() => profiles.id),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

// Trip instances
export const tripInstances = pgTable("trip_instances", {
  id: uuid("id").primaryKey().defaultRandom(),
  tripId: uuid("trip_id")
    .notNull()
    .references(() => trips.id),
  serviceDate: date("service_date").notNull(),
  status: runStatusEnum("status").notNull().default("scheduled"),
  reason: text("reason"),
  delayMin: smallint("delay_min").notNull().default(0),
  delaySource: delaySourceEnum("delay_source"),
  busId: uuid("bus_id").references(() => buses.id),
  driverId: uuid("driver_id").references(() => drivers.id),
  startedAt: timestamp("started_at", { withTimezone: true }),
  endedAt: timestamp("ended_at", { withTimezone: true }),
  lastPos: pointGeography("last_pos"),
  lastPositionAt: timestamp("last_position_at", { withTimezone: true }),
  lastProgressM: integer("last_progress_m"),
  lastSpeedMps: real("last_speed_mps"),
});

// Bus positions
export const busPositions = pgTable("bus_positions", {
  id: bigserial("id", { mode: "number" }).primaryKey(),
  tripInstanceId: uuid("trip_instance_id")
    .notNull()
    .references(() => tripInstances.id, { onDelete: "cascade" }),
  recordedAt: timestamp("recorded_at", { withTimezone: true }).notNull(),
  pos: pointGeography("pos").notNull(),
  speedMps: real("speed_mps"),
  heading: smallint("heading"),
  accuracyM: real("accuracy_m"),
  progressM: integer("progress_m"),
});

// Notices
export const notices = pgTable("notices", {
  id: uuid("id").primaryKey().defaultRandom(),
  type: noticeTypeEnum("type").notNull(),
  severity: noticeSeverityEnum("severity").notNull(),
  title: text("title").notNull(),
  body: text("body").notNull(),
  startsAt: timestamp("starts_at", { withTimezone: true }).notNull().defaultNow(),
  endsAt: timestamp("ends_at", { withTimezone: true }),
  isPublished: boolean("is_published").notNull().default(false),
  isAuto: boolean("is_auto").notNull().default(false),
  createdBy: uuid("created_by").references(() => profiles.id),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

// Notice targets
export const noticeTargets = pgTable("notice_targets", {
  id: uuid("id").primaryKey().defaultRandom(),
  noticeId: uuid("notice_id")
    .notNull()
    .references(() => notices.id, { onDelete: "cascade" }),
  routeId: uuid("route_id").references(() => routes.id),
  stopId: uuid("stop_id").references(() => stops.id),
  tripId: uuid("trip_id").references(() => trips.id),
});

// Subscriptions
export const subscriptions = pgTable("subscriptions", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .notNull()
    .references(() => profiles.id, { onDelete: "cascade" }),
  routeId: uuid("route_id").references(() => routes.id, { onDelete: "cascade" }),
  stopId: uuid("stop_id").references(() => stops.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

// Push subscriptions
export const pushSubscriptions = pgTable("push_subscriptions", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .notNull()
    .references(() => profiles.id, { onDelete: "cascade" }),
  endpoint: text("endpoint").notNull().unique(),
  p256dh: text("p256dh").notNull(),
  auth: text("auth").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  lastSuccessAt: timestamp("last_success_at", { withTimezone: true }),
});

// Saved places
export const savedPlaces = pgTable("saved_places", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .notNull()
    .references(() => profiles.id, { onDelete: "cascade" }),
  label: text("label").notNull(),
  geom: pointGeography("geom").notNull(),
});

// Audit log
export const auditLog = pgTable("audit_log", {
  id: bigserial("id", { mode: "number" }).primaryKey(),
  at: timestamp("at", { withTimezone: true }).notNull().defaultNow(),
  actorId: uuid("actor_id").references(() => profiles.id),
  action: text("action").notNull(),
  entity: text("entity").notNull(),
  entityId: uuid("entity_id"),
  summary: text("summary"),
  before: jsonb("before"),
  after: jsonb("after"),
});
