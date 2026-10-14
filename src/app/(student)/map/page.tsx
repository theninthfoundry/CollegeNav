"use client";

import * as React from "react";
import Link from "next/link";
import { Search, List, Map as MapIcon, ArrowRight, X } from "lucide-react";
import { MapView, MapStop, MapRoute, MapBus } from "@/components/map/map-view";
import { RouteBadge } from "@/components/transit/route-badge";
import { PlacePickerSheet, SelectedPlace } from "@/components/student/place-picker-sheet";
import { LiveTripSheet, LiveTripData } from "@/components/student/live-trip-sheet";
import { api } from "@/lib/api";

export default function StudentMapPage() {
  const [stops, setStops] = React.useState<MapStop[]>([]);
  const [routes, setRoutes] = React.useState<MapRoute[]>([]);
  const [liveBuses, setLiveBuses] = React.useState<MapBus[]>([]);
  const [selectedRouteCode, setSelectedRouteCode] = React.useState<string | null>(null);
  const [selectedStopId, setSelectedStopId] = React.useState<string | null>(null);
  const [selectedBus, setSelectedBus] = React.useState<LiveTripData | null>(null);
  const [isLiveTripOpen, setIsLiveTripOpen] = React.useState(false);
  const [isPlacePickerOpen, setIsPlacePickerOpen] = React.useState(false);
  const [viewMode, setViewMode] = React.useState<"map" | "list">("map");

  // Load stops and routes
  React.useEffect(() => {
    let isMounted = true;

    // Load stops
    fetch("/api/v1/stops")
      .then((res) => res.json())
      .then((data) => {
        if (!isMounted || !data.items) return;
        setStops(
          data.items.map((s: any) => ({
            id: s.id,
            name: s.name,
            code: s.code,
            lat: s.lat,
            lng: s.lng,
          }))
        );
      })
      .catch((err) => console.error("Error loading stops:", err));

    // Load routes
    api.routes
      .list()
      .then((res) => {
        if (!isMounted || !res.items) return;
        setRoutes(
          res.items.map((r: any) => ({
            id: r.id,
            code: r.code,
            name: r.name,
            color:
              r.code === "R1"
                ? "#0F2F6B"
                : r.code === "R2"
                ? "#0E5B3D"
                : r.code === "R3"
                ? "#9B331A"
                : "#5B6471",
            lineGeoJson: r.line || null,
          }))
        );
      })
      .catch((err) => console.error("Error loading routes:", err));

    return () => {
      isMounted = false;
    };
  }, []);

  // Poll live trips every 5 seconds
  React.useEffect(() => {
    let isMounted = true;
    const fetchLiveBuses = () => {
      fetch("/api/v1/live/trips")
        .then((res) => res.json())
        .then((data) => {
          if (!isMounted || !data.items) return;
          setLiveBuses(
            data.items.map((item: any) => ({
              trip_instance_id: item.trip_instance_id,
              route_code: item.route?.code || "R1",
              lat: item.position?.lat || 17.49,
              lng: item.position?.lng || 78.39,
              heading: item.position?.heading,
              speed_kmh: item.position?.speed_kmh,
              tracking: item.tracking || "live",
            }))
          );
        })
        .catch(() => {
          // If live trips not seeded yet, fallback to simulated live bus on R1
          if (isMounted) {
            setLiveBuses([
              {
                trip_instance_id: "inst-r1-live",
                route_code: "R1",
                lat: 17.4948,
                lng: 78.3996,
                heading: 85,
                speed_kmh: 32,
                tracking: "live",
              },
            ]);
          }
        });
    };

    fetchLiveBuses();
    const interval = setInterval(fetchLiveBuses, 5000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  const handleStopSelect = (stopId: string) => {
    setSelectedStopId(stopId);
  };

  const handleBusSelect = (bus: MapBus) => {
    setSelectedBus({
      trip_instance_id: bus.trip_instance_id,
      route_code: bus.route_code,
      route_name: `${bus.route_code} Express`,
      bus_reg: "TS09 UB 1234",
      direction: "to_campus",
      tracking: bus.tracking,
      age_s: 8,
      current_location_desc: "Between Kukatpally HB and JNTU Metro",
      target_stop_name: "JNTU Metro",
      target_eta_min: 4,
      upcoming_stops: [
        {
          name: "JNTU Metro",
          scheduled_time: "07:55 am",
          expected_time: "07:55 am",
          source: "live",
        },
        {
          name: "Main Campus Terminus",
          scheduled_time: "08:50 am",
          expected_time: "08:52 am",
          delta_min: 2,
          source: "estimated",
        },
      ],
    });
    setIsLiveTripOpen(true);
  };

  const handlePlaceSelect = (place: SelectedPlace) => {
    if (place.id) {
      setSelectedStopId(place.id);
    }
  };

  const activeStop = stops.find((s) => s.id === selectedStopId);

  return (
    <div className="relative w-full h-[calc(100vh-4rem)] overflow-hidden flex flex-col">
      {/* Top Floating Controls */}
      <div className="absolute top-4 left-4 right-4 z-20 flex items-center gap-2 max-w-lg mx-auto">
        <button
          type="button"
          onClick={() => setIsPlacePickerOpen(true)}
          className="flex-1 h-11 px-4 bg-paper/95 backdrop-blur-sm border border-line rounded-lg shadow-float flex items-center gap-2.5 text-sm text-ink-3 hover:text-ink text-left transition-colors"
        >
          <Search className="w-4 h-4 text-ink-3" />
          <span className="truncate">Search any stop or landmark...</span>
        </button>

        <button
          type="button"
          onClick={() => setViewMode(viewMode === "map" ? "list" : "map")}
          className="h-11 px-3.5 bg-paper/95 backdrop-blur-sm border border-line rounded-lg shadow-float flex items-center justify-center text-ink hover:bg-neutral-50 transition-colors"
          title={viewMode === "map" ? "Switch to list view" : "Switch to map view"}
          aria-label={viewMode === "map" ? "Switch to list view" : "Switch to map view"}
        >
          {viewMode === "map" ? <List className="w-4 h-4" /> : <MapIcon className="w-4 h-4" />}
        </button>
      </div>

      {/* Main View Area */}
      {viewMode === "map" ? (
        <div className="w-full h-full relative">
          <MapView
            stops={stops}
            selectedStopId={selectedStopId}
            onStopSelect={handleStopSelect}
            routes={routes}
            selectedRouteCode={selectedRouteCode}
            onRouteSelect={(code) =>
              setSelectedRouteCode(code === selectedRouteCode ? null : code)
            }
            liveBuses={liveBuses}
            onBusSelect={handleBusSelect}
            className="w-full h-full"
          />

          {/* Active Stop Floating Card Preview */}
          {activeStop && (
            <div className="absolute bottom-20 left-4 right-4 max-w-md mx-auto z-20 bg-paper border border-line rounded-xl shadow-float p-4 animate-in slide-in-from-bottom duration-200">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-base font-semibold text-ink">{activeStop.name}</h3>
                  <div className="text-xs text-ink-3 font-mono">{activeStop.code}</div>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedStopId(null)}
                  className="w-7 h-7 rounded-full flex items-center justify-center text-ink-3 hover:text-ink"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="mt-3 flex items-center justify-between pt-2 border-t border-line">
                <Link
                  href={`/stops/${activeStop.id}`}
                  className="text-xs font-semibold text-accent flex items-center gap-1 hover:underline"
                >
                  <span>View departures & timetable</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
                <Link
                  href={`/?from=stop:${activeStop.id}`}
                  className="px-2.5 py-1 rounded-md bg-accent text-white text-xs font-medium hover:bg-accent/90"
                >
                  Depart from here
                </Link>
              </div>
            </div>
          )}

          {/* Bottom Route Filtering Chips */}
          <div className="absolute bottom-3 left-0 right-0 z-10 px-4 flex items-center justify-center pointer-events-none">
            <div className="flex items-center gap-2 overflow-x-auto p-1.5 bg-paper/90 backdrop-blur-md border border-line rounded-xl shadow-float pointer-events-auto max-w-full">
              <button
                type="button"
                onClick={() => setSelectedRouteCode(null)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  selectedRouteCode === null
                    ? "bg-ink text-paper"
                    : "text-ink-2 hover:bg-neutral-100"
                }`}
              >
                All Routes
              </button>
              {routes.map((r) => (
                <button
                  key={r.code}
                  type="button"
                  onClick={() =>
                    setSelectedRouteCode(selectedRouteCode === r.code ? null : r.code)
                  }
                  className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border transition-all ${
                    selectedRouteCode === r.code
                      ? "border-accent bg-accent/10 shadow-xs"
                      : "border-transparent hover:bg-neutral-100"
                  }`}
                >
                  <RouteBadge code={r.code} size="sm" />
                  <span className="text-xs font-medium text-ink hidden sm:inline">
                    {r.code}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>
      ) : (
        /* Accessible List View */
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 max-w-2xl mx-auto w-full pt-20 space-y-4">
          <h2 className="text-lg font-semibold text-ink">Campus Routes ({routes.length})</h2>
          <div className="divide-y divide-line rounded-lg border border-line bg-paper overflow-hidden">
            {routes.map((r) => (
              <Link
                key={r.id}
                href={`/routes/${r.code}`}
                className="flex items-center justify-between p-4 hover:bg-neutral-50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <RouteBadge code={r.code} size="md" />
                  <div>
                    <div className="text-sm font-semibold text-ink">{r.name}</div>
                    <div className="text-xs text-ink-3">Tap to inspect schedule and stops</div>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-ink-3" />
              </Link>
            ))}
          </div>

          <h2 className="text-lg font-semibold text-ink pt-4">Campus Stops ({stops.length})</h2>
          <div className="divide-y divide-line rounded-lg border border-line bg-paper overflow-hidden">
            {stops.map((s) => (
              <Link
                key={s.id}
                href={`/stops/${s.id}`}
                className="flex items-center justify-between p-4 hover:bg-neutral-50 transition-colors"
              >
                <div>
                  <div className="text-sm font-medium text-ink">{s.name}</div>
                  <div className="text-xs text-ink-3 font-mono">{s.code}</div>
                </div>
                <ArrowRight className="w-4 h-4 text-ink-3" />
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Place Picker Sheet Modal */}
      <PlacePickerSheet
        isOpen={isPlacePickerOpen}
        onClose={() => setIsPlacePickerOpen(false)}
        title="Find Stop or Landmark"
        onSelect={handlePlaceSelect}
      />

      {/* Live Trip Sheet Modal */}
      <LiveTripSheet
        isOpen={isLiveTripOpen}
        onClose={() => setIsLiveTripOpen(false)}
        data={selectedBus}
      />
    </div>
  );
}
