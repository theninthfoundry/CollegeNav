import { getAllStops, getStopById } from "../repositories/stops.repository";
import { getAllRoutes, getAllRouteStops } from "../repositories/routes.repository";
import { getAllTrips, getTripInstances } from "../repositories/trips.repository";
import { planJourney } from "@/domain/planner";
import { PlaceQuery, PlannerMode } from "@/domain/types";
import { ApiError } from "@/lib/errors";

export interface PlanServiceInput {
  fromParam: string;
  toParam?: string;
  mode?: PlannerMode;
  atParam?: string;
  walkMaxMeters?: number;
  limit?: number;
}

function parsePlace(param: string): PlaceQuery {
  if (param.startsWith("stop:")) {
    return { type: "stop", stopId: param.slice(5) };
  }
  if (param.startsWith("pt:")) {
    const [latStr, lngStr] = param.slice(3).split(",");
    const lat = parseFloat(latStr);
    const lng = parseFloat(lngStr);
    if (isNaN(lat) || isNaN(lng)) {
      throw new ApiError("validation_failed", "Invalid coordinates format. Expected pt:lat,lng", 400);
    }
    return { type: "point", lat, lng };
  }
  // Try treating as stop id directly
  return { type: "stop", stopId: param };
}

export async function executePlan(input: PlanServiceInput) {
  const { fromParam, toParam, mode = "now", atParam, walkMaxMeters = 800, limit = 5 } = input;

  if (!fromParam) {
    throw new ApiError("validation_failed", "from parameter is required", 400, { field: "from" });
  }

  const fromPlace = parsePlace(fromParam);

  const stops = await getAllStops();
  let toPlace: PlaceQuery;

  if (toParam) {
    toPlace = parsePlace(toParam);
  } else {
    // Default to Campus stop
    const campusStop = stops.find((s) => s.is_campus);
    if (!campusStop) {
      throw new ApiError("internal", "Campus stop not configured", 500);
    }
    toPlace = { type: "stop", stopId: campusStop.id };
  }

  const queryTime = atParam ? new Date(atParam) : new Date();
  const serviceDate = queryTime.toISOString().split("T")[0];

  const routes = await getAllRoutes();
  const routeStops = await getAllRouteStops();
  const trips = await getAllTrips();
  const instances = await getTripInstances(serviceDate);

  const planResult = planJourney({
    origin: fromPlace,
    destination: toPlace,
    mode,
    queryTime,
    serviceDate,
    stops,
    routes,
    routeStops,
    trips,
    instances,
    walkMaxMeters,
    limit,
  });

  return planResult;
}
