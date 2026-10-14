import {
  DEFAULT_CIRCUITY_FACTOR,
  DEFAULT_WALK_MAX_METERS,
  DEFAULT_WALK_SPEED_METERS_PER_MIN,
  findCandidateStops,
  haversineDistanceMeters,
} from "../geo";
import { computeFreshness, DEFAULT_FRESHNESS_SETTINGS } from "../freshness";
import { expandTrips, formatKolkataIso } from "../time";
import {
  FreshnessSettings,
  JourneyOption,
  PlaceQuery,
  PlannerMode,
  PlanReason,
  PlanResult,
  RouteLike,
  RouteStopLike,
  Source,
  StopCall,
  StopLike,
  TripInstanceLike,
  TripLike,
} from "../types";

export type PlanJourneyInput = {
  origin: PlaceQuery;
  destination: PlaceQuery;
  mode: PlannerMode;
  queryTime: Date;
  serviceDate: string; // "YYYY-MM-DD"
  stops: StopLike[];
  routes: RouteLike[];
  routeStops: RouteStopLike[];
  trips: TripLike[];
  instances?: TripInstanceLike[];
  settings?: FreshnessSettings;
  walkMaxMeters?: number;
  limit?: number;
};

export function planJourney(input: PlanJourneyInput): PlanResult {
  const {
    origin,
    destination,
    mode = "now",
    queryTime,
    serviceDate,
    stops,
    routes,
    routeStops,
    trips,
    instances = [],
    settings = DEFAULT_FRESHNESS_SETTINGS,
    walkMaxMeters = DEFAULT_WALK_MAX_METERS,
    limit = 5,
  } = input;

  const baseResult: PlanResult = {
    query: {
      from: origin,
      to: destination,
      mode,
      at: formatKolkataIso(queryTime),
    },
    options: [],
    reason: null,
  };

  // 1. Find candidate stops
  const nearOrigin = findCandidateStops(origin, stops, walkMaxMeters);
  const nearDest = findCandidateStops(destination, stops, walkMaxMeters);

  if (nearOrigin.length === 0) {
    let nearestStop: StopLike | undefined;
    let minDistance = Infinity;

    if (origin.type === "point") {
      for (const s of stops.filter((st) => st.is_active !== false)) {
        const d = haversineDistanceMeters(origin.lat, origin.lng, s.lat, s.lng);
        if (d < minDistance) {
          minDistance = d;
          nearestStop = s;
        }
      }
    }

    return {
      ...baseResult,
      reason: "no_stop_near_origin",
      ...(nearestStop ? { nearest_origin_stop: { stop: nearestStop, distance_m: minDistance } } : {}),
      suggestion: nearestStop ? `Closest stop is ${nearestStop.name} (${Math.round(minDistance)} m away)` : undefined,
    };
  }

  if (nearDest.length === 0) {
    let nearestStop: StopLike | undefined;
    let minDistance = Infinity;

    if (destination.type === "point") {
      for (const s of stops.filter((st) => st.is_active !== false)) {
        const d = haversineDistanceMeters(destination.lat, destination.lng, s.lat, s.lng);
        if (d < minDistance) {
          minDistance = d;
          nearestStop = s;
        }
      }
    }

    return {
      ...baseResult,
      reason: "no_stop_near_destination",
      ...(nearestStop ? { nearest_destination_stop: { stop: nearestStop, distance_m: minDistance } } : {}),
      suggestion: nearestStop ? `Closest stop is ${nearestStop.name} (${Math.round(minDistance)} m away)` : undefined,
    };
  }

  // 2. Filter active routes (exclude suspended and archived)
  const activeRoutes = routes.filter((r) => r.status === "active");
  const routeMap = new Map(routes.map((r) => [r.id, r]));
  const stopMap = new Map(stops.map((s) => [s.id, s]));

  // Check if any route physically connects nearOrigin to nearDest
  const originStopIds = new Set(nearOrigin.map((c) => c.stop.id));
  const destStopIds = new Set(nearDest.map((c) => c.stop.id));

  let anyRouteConnects = false;
  for (const r of activeRoutes) {
    const stopsInRoute = routeStops
      .filter((rs) => rs.route_id === r.id)
      .sort((a, b) => a.seq - b.seq);

    for (let i = 0; i < stopsInRoute.length; i++) {
      if (originStopIds.has(stopsInRoute[i].stop_id)) {
        for (let j = i + 1; j < stopsInRoute.length; j++) {
          if (destStopIds.has(stopsInRoute[j].stop_id)) {
            anyRouteConnects = true;
            break;
          }
        }
      }
      if (anyRouteConnects) break;
    }
    if (anyRouteConnects) break;
  }

  // 3. Expand trips for the date
  const expandedCalls = expandTrips({
    serviceDate,
    trips: trips.filter((t) => {
      const r = routeMap.get(t.route_id);
      return r && r.status === "active";
    }),
    routeStops,
    instances,
  });

  // Index calls by tripId: StopCall[]
  const tripCallsMap = new Map<string, StopCall[]>();
  for (const call of expandedCalls) {
    if (call.status === "cancelled") continue; // Skip cancelled calls
    const list = tripCallsMap.get(call.tripId) || [];
    list.push(call);
    tripCallsMap.set(call.tripId, list);
  }

  type CandidateJourney = {
    tripId: string;
    route: RouteLike;
    instanceId?: string;
    boardStop: StopLike;
    alightStop: StopLike;
    boardCall: StopCall;
    alightCall: StopCall;
    walkInMin: number;
    walkInMeters: number;
    walkOutMin: number;
    walkOutMeters: number;
    waitMin: number;
    rideMin: number;
    totalMin: number;
    cost: number;
    departAt: Date;
    arriveAt: Date;
    source: Source;
    freshness: ReturnType<typeof computeFreshness>;
  };

  const candidates: CandidateJourney[] = [];

  for (const [tripId, calls] of tripCallsMap.entries()) {
    calls.sort((a, b) => a.seq - b.seq);
    const tripRouteId = calls[0].routeId;
    const route = routeMap.get(tripRouteId);
    if (!route) continue;

    const freshness = computeFreshness(route, queryTime, settings);

    let bestPairForTrip: CandidateJourney | null = null;

    for (const candOrigin of nearOrigin) {
      const callA = calls.find((c) => c.stopId === candOrigin.stop.id);
      if (!callA) continue;

      for (const candDest of nearDest) {
        const callB = calls.find((c) => c.stopId === candDest.stop.id);
        if (!callB) continue;

        // Enforce stop order: seq(alight) must be greater than seq(board)
        if (callB.seq <= callA.seq) continue;

        const boardAt = callA.expectedAt;
        const alightAt = callB.expectedAt;

        const walkInMin = candOrigin.walkMinutes;
        const walkOutMin = candDest.walkMinutes;

        const leaveAt = new Date(boardAt.getTime() - walkInMin * 60000);
        const arriveAt = new Date(alightAt.getTime() + walkOutMin * 60000);

        // Feasibility check based on mode
        if (mode === "now" || mode === "depart") {
          if (leaveAt.getTime() < queryTime.getTime()) continue;
        } else if (mode === "arrive") {
          if (arriveAt.getTime() > queryTime.getTime()) continue;
        }

        const waitMin = Math.max(0, Math.round((boardAt.getTime() - (queryTime.getTime() + walkInMin * 60000)) / 60000));
        const rideMin = Math.max(1, Math.round((alightAt.getTime() - boardAt.getTime()) / 60000));
        const walkMin = walkInMin + walkOutMin;
        const totalMin = walkInMin + waitMin + rideMin + walkOutMin;

        // Cost function according to docs/09 section 3.5
        const freshnessPenalty =
          freshness.state === "aging"
            ? 5
            : freshness.state === "unverified"
            ? 10
            : freshness.state === "outdated"
            ? 25
            : 0;

        const cost = 2.0 * walkMin + 1.0 * waitMin + 1.0 * rideMin + freshnessPenalty;

        // Determine source label
        const instance = instances.find((inst) => inst.id === callA.instanceId || inst.trip_id === tripId);
        let source: Source = "scheduled";
        if (instance?.status === "running") {
          source = "live";
        } else if ((instance?.delay_min && instance.delay_min !== 0) || instance?.last_position_at) {
          source = "estimated";
        }

        const journey: CandidateJourney = {
          tripId,
          route,
          instanceId: callA.instanceId,
          boardStop: candOrigin.stop,
          alightStop: candDest.stop,
          boardCall: callA,
          alightCall: callB,
          walkInMin,
          walkInMeters: candOrigin.walkMeters,
          walkOutMin,
          walkOutMeters: candDest.walkMeters,
          waitMin,
          rideMin,
          totalMin,
          cost,
          departAt: leaveAt,
          arriveAt,
          source,
          freshness,
        };

        if (!bestPairForTrip || journey.cost < bestPairForTrip.cost) {
          bestPairForTrip = journey;
        }
      }
    }

    if (bestPairForTrip) {
      candidates.push(bestPairForTrip);
    }
  }

  // If no candidates found
  if (candidates.length === 0) {
    return {
      ...baseResult,
      reason: anyRouteConnects ? "no_service_remaining_today" : "no_route_connects",
      suggestion: anyRouteConnects
        ? "No more buses today on connecting routes"
        : "No direct route connects these stops. Try walking to another stop.",
    };
  }

  // Deduplicate: best option per route
  const byRoute = new Map<string, CandidateJourney>();
  for (const c of candidates) {
    const existing = byRoute.get(c.route.id);
    if (!existing) {
      byRoute.set(c.route.id, c);
    } else if (mode === "arrive") {
      // In arrive-by mode, prefer latest feasible departure so students aren't told to leave early
      if (
        c.departAt.getTime() > existing.departAt.getTime() ||
        (c.departAt.getTime() === existing.departAt.getTime() && c.cost < existing.cost)
      ) {
        byRoute.set(c.route.id, c);
      }
    } else if (c.cost < existing.cost) {
      byRoute.set(c.route.id, c);
    }
  }

  const deduped = Array.from(byRoute.values());

  // Ranking
  if (mode === "arrive") {
    // Latest feasible departure, then lowest cost
    deduped.sort((a, b) => b.departAt.getTime() - a.departAt.getTime() || a.cost - b.cost);
  } else {
    // Lowest cost, earlier arrival, less walking
    deduped.sort(
      (a, b) => a.cost - b.cost || a.arriveAt.getTime() - b.arriveAt.getTime() || a.walkInMin - b.walkInMin
    );
  }

  const selected = deduped.slice(0, limit);

  // Format into JourneyOption[]
  const options: JourneyOption[] = selected.map((c, index) => {
    const isOutdated = c.freshness.state === "outdated";
    // First result is marked best UNLESS its route is outdated
    const best = index === 0 && !isOutdated;
    const warnings: string[] = [];
    if (isOutdated) {
      warnings.push("Schedule may be outdated");
    }

    return {
      id: `opt_${index + 1}`,
      rank: index + 1,
      best,
      route: {
        id: c.route.id,
        code: c.route.code,
        name: c.route.name,
        color_index: c.route.color_index,
      },
      trip_instance_id: c.instanceId,
      board: {
        stop: c.boardStop,
        time: {
          at: formatKolkataIso(c.boardCall.expectedAt),
          source: c.source,
        },
      },
      alight: {
        stop: c.alightStop,
        time: {
          at: formatKolkataIso(c.alightCall.expectedAt),
          source: c.source,
        },
      },
      walk_to_board: {
        meters: c.walkInMeters,
        minutes: c.walkInMin,
      },
      walk_from_alight: {
        meters: c.walkOutMeters,
        minutes: c.walkOutMin,
      },
      wait_min: c.waitMin,
      ride_min: c.rideMin,
      total_min: c.totalMin,
      depart_at: formatKolkataIso(c.departAt),
      arrive_at: formatKolkataIso(c.arriveAt),
      freshness: c.freshness,
      warnings,
      notices: [],
    };
  });

  return {
    ...baseResult,
    options,
    reason: null,
  };
}
