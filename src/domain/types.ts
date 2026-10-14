/**
 * Pure domain types for CollegeNav.
 * No database, framework, or network imports.
 */

export type Direction = "to_campus" | "from_campus";

export type RouteStatus = "active" | "suspended" | "archived";

export type RunStatus = "scheduled" | "running" | "completed" | "cancelled";

export type DelaySource = "admin" | "driver" | "live";

export type Source = "live" | "estimated" | "scheduled" | "unavailable";

export type FreshnessState = "verified" | "aging" | "outdated" | "unverified";

export type Freshness = {
  state: FreshnessState;
  verified_at: string | null;
  days_since: number | null;
  valid_to: string | null;
  message: string;
};

export type TimePoint = {
  at: string; // ISO 8601 with Asia/Kolkata offset
  source: Source;
};

export type RouteRef = {
  id: string;
  code: string;
  name: string;
  color_index: number;
};

export type StopLike = {
  id: string;
  code?: string | null;
  name: string;
  lat: number;
  lng: number;
  landmark?: string | null;
  step_free?: boolean | null;
  is_campus?: boolean;
  is_active?: boolean;
};

export type RouteLike = {
  id: string;
  code: string;
  name: string;
  color_index: number;
  status: RouteStatus;
  status_reason?: string | null;
  valid_from?: string | null;
  valid_to?: string | null;
  verified_at?: string | Date | null;
};

export type RouteStopLike = {
  route_id: string;
  direction: Direction;
  seq: number;
  stop_id: string;
  offset_min: number;
  dwell_s?: number;
  progress_m?: number;
};

export type TripLike = {
  id: string;
  route_id: string;
  direction: Direction;
  depart_time: string; // "07:30" or "07:30:00"
  days: number; // bitmask
  bus_id?: string | null;
  valid_from?: string | null;
  valid_to?: string | null;
  is_active?: boolean;
  verified_at?: string | Date | null;
};

export type TripInstanceLike = {
  id: string;
  trip_id: string;
  service_date: string; // "YYYY-MM-DD"
  status: RunStatus;
  reason?: string | null;
  delay_min?: number;
  delay_source?: DelaySource | null;
  bus_id?: string | null;
  driver_id?: string | null;
  started_at?: string | Date | null;
  ended_at?: string | Date | null;
  last_pos?: { lat: number; lng: number } | null;
  last_position_at?: string | Date | null;
  last_progress_m?: number | null;
  last_speed_mps?: number | null;
};

export type StopCall = {
  tripId: string;
  instanceId?: string;
  routeId: string;
  direction: Direction;
  stopId: string;
  seq: number;
  scheduledAt: Date;
  expectedAt: Date;
  status: RunStatus;
  delayMin: number;
};

export type FreshnessSettings = {
  verifiedDays: number;
  agingDays: number;
};

export type PlannerMode = "now" | "depart" | "arrive";

export type PlaceQuery =
  | { type: "stop"; stopId: string }
  | { type: "point"; lat: number; lng: number };

export type JourneyOption = {
  id: string;
  rank: number;
  best: boolean;
  route: RouteRef;
  trip_instance_id?: string;
  board: {
    stop: StopLike;
    time: TimePoint;
  };
  alight: {
    stop: StopLike;
    time: TimePoint;
  };
  walk_to_board: {
    meters: number;
    minutes: number;
  };
  walk_from_alight: {
    meters: number;
    minutes: number;
  };
  wait_min: number;
  ride_min: number;
  total_min: number;
  depart_at: string;
  arrive_at: string;
  freshness: Freshness;
  warnings: string[];
  notices: string[];
  geometry?: {
    walk_in?: [number, number][];
    ride?: [number, number][];
    walk_out?: [number, number][];
  };
};

export type PlanReason =
  | "no_stop_near_origin"
  | "no_stop_near_destination"
  | "no_route_connects"
  | "no_service_remaining_today";

export type PlanResult = {
  query: {
    from: PlaceQuery;
    to: PlaceQuery;
    mode: PlannerMode;
    at: string;
  };
  options: JourneyOption[];
  reason: PlanReason | null;
  nearest_origin_stop?: { stop: StopLike; distance_m: number };
  nearest_destination_stop?: { stop: StopLike; distance_m: number };
  suggestion?: string;
};
