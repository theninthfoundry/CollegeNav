"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowUpDown, LocateFixed, Search, Bus, MapPin, Sparkles, Navigation, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Segmented } from "@/components/ui/segmented";
import { RouteBadge } from "@/components/transit/route-badge";
import { SourceLabel } from "@/components/transit/source-label";
import { NoticeBanner } from "@/components/transit/notice-banner";
import { Skeleton } from "@/components/ui/skeleton";
import { PlacePickerSheet, SelectedPlace } from "@/components/student/place-picker-sheet";
import { api } from "@/lib/api";
import { copy } from "@/copy/en";

const MAIN_CAMPUS_ID = "10000000-0000-0000-0000-000000000000";
const KPHB_STOP_ID = "10000000-0000-0000-0000-000000000002";
const MIYAPUR_STOP_ID = "10000000-0000-0000-0000-000000000001";
const JNTU_STOP_ID = "10000000-0000-0000-0000-000000000003";
const SECUNDERABAD_STOP_ID = "10000000-0000-0000-0000-000000000006";

export default function StudentHomePage() {
  const router = useRouter();

  const [fromQuery, setFromQuery] = React.useState("Kukatpally Housing Board");
  const [toQuery, setToQuery] = React.useState("Main Campus");
  const [selectedFromStopId, setSelectedFromStopId] = React.useState<string>(KPHB_STOP_ID);
  const [selectedToStopId, setSelectedToStopId] = React.useState<string>(MAIN_CAMPUS_ID);
  const [pickerTarget, setPickerTarget] = React.useState<"from" | "to" | null>(null);

  const [timeMode, setTimeMode] = React.useState<"now" | "depart" | "arrive">("now");
  const [selectedTime, setSelectedTime] = React.useState("07:30");

  const [stops, setStops] = React.useState<any[]>([]);
  const [activeNotice, setActiveNotice] = React.useState<any>(null);
  const [routes, setRoutes] = React.useState<any[]>([]);
  const [liveDepartures, setLiveDepartures] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [findingLocation, setFindingLocation] = React.useState(false);

  React.useEffect(() => {
    let isMounted = true;

    Promise.all([
      api.stops.search({ limit: 12 }),
      api.notices.list({ limit: 1 }),
      api.routes.list(),
      api.stops.departures(KPHB_STOP_ID, { limit: 4 }).catch(() => ({ items: [] })),
    ])
      .then(([stopsRes, noticesRes, routesRes, departuresRes]) => {
        if (!isMounted) return;
        const allStops = stopsRes.items || [];
        setStops(allStops);

        if (noticesRes.items?.length > 0) {
          setActiveNotice(noticesRes.items[0]);
        }
        setRoutes(routesRes.items || []);
        setLiveDepartures(departuresRes.items || []);

        // Ensure campus stop is selected as destination if available
        const campus = allStops.find((s: any) => s.is_campus);
        if (campus) {
          setToQuery(campus.name);
          setSelectedToStopId(campus.id);
        }

        // Set default origin
        const defaultFrom = allStops.find((s: any) => s.id === KPHB_STOP_ID) || allStops[1];
        if (defaultFrom) {
          setFromQuery(defaultFrom.name);
          setSelectedFromStopId(defaultFrom.id);
        }

        setLoading(false);
      })
      .catch(() => {
        if (!isMounted) return;
        setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const handleSwap = () => {
    const tempQuery = fromQuery;
    const tempId = selectedFromStopId;
    setFromQuery(toQuery);
    setSelectedFromStopId(selectedToStopId);
    setToQuery(tempQuery);
    setSelectedToStopId(tempId);
  };

  const handleUseLocation = () => {
    setFindingLocation(true);
    if (!navigator.geolocation) {
      setFindingLocation(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setFindingLocation(false);
        const { latitude, longitude } = pos.coords;
        setFromQuery("Current location");
        setSelectedFromStopId(`pt:${latitude.toFixed(4)},${longitude.toFixed(4)}`);
      },
      () => {
        setFindingLocation(false);
      },
      { timeout: 6000 }
    );
  };

  const handleFindBuses = () => {
    const fromParam = selectedFromStopId || `stop:${fromQuery}`;
    const toParam = selectedToStopId ? `stop:${selectedToStopId}` : `stop:${MAIN_CAMPUS_ID}`;

    const q = new URLSearchParams();
    q.set("from", fromParam);
    if (toParam) q.set("to", toParam);
    q.set("mode", timeMode);
    if (timeMode !== "now") {
      const today = new Date().toISOString().split("T")[0];
      q.set("at", `${today}T${selectedTime}:00+05:30`);
    }

    router.push(`/plan?${q.toString()}`);
  };

  // 1-Tap Quick Action: Commute To Campus immediately
  const handleQuickToCampus = () => {
    const q = new URLSearchParams();
    q.set("from", KPHB_STOP_ID);
    q.set("to", `stop:${MAIN_CAMPUS_ID}`);
    q.set("mode", "now");
    router.push(`/plan?${q.toString()}`);
  };

  // 1-Tap Quick Action: Commute From Campus home
  const handleQuickFromCampus = () => {
    const q = new URLSearchParams();
    q.set("from", MAIN_CAMPUS_ID);
    q.set("to", `stop:${KPHB_STOP_ID}`);
    q.set("mode", "now");
    router.push(`/plan?${q.toString()}`);
  };

  return (
    <div className="max-w-2xl mx-auto p-4 sm:p-6 space-y-6">
      {/* Student Section Identity Banner Card */}
      <div className="rounded-xl border border-line bg-gradient-to-b from-surface-1 to-paper p-4 sm:p-5 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold bg-accent-tint text-accent border border-accent/20">
              <span className="w-2 h-2 rounded-full bg-accent animate-pulse" aria-hidden="true" />
              <span>Student Section</span>
            </span>
            <span className="text-xs text-ink-3">Campus Shuttle Service</span>
          </div>
          <span className="text-xs font-medium text-ok flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-ok" aria-hidden="true" />
            4 Routes In Service
          </span>
        </div>

        <div>
          <h1 className="font-serif text-3xl sm:text-4xl font-normal tracking-tight text-ink">
            {copy.home.heading}
          </h1>
          <p className="text-sm text-ink-3 mt-1">
            Real-time college bus navigation, live GPS updates, and verified schedules.
          </p>
        </div>

        {/* 1-Tap Quick Commute Bar */}
        <div className="pt-1 flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={handleQuickToCampus}
            className="flex-1 min-w-[140px] flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-lg bg-ink text-paper text-xs font-semibold hover:bg-ink-2 active:scale-[0.98] transition-all min-h-[44px]"
          >
            <Navigation className="w-3.5 h-3.5" />
            <span>To Campus Now</span>
          </button>
          <button
            type="button"
            onClick={handleQuickFromCampus}
            className="flex-1 min-w-[140px] flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-lg border border-line-strong bg-paper text-ink text-xs font-semibold hover:bg-surface-1 active:scale-[0.98] transition-all min-h-[44px]"
          >
            <Bus className="w-3.5 h-3.5 text-accent" />
            <span>Return Home</span>
          </button>
          <Link
            href="/map"
            className="flex items-center justify-center gap-1 px-3 py-2.5 rounded-lg border border-line bg-paper text-ink-2 text-xs font-semibold hover:text-ink hover:bg-surface-1 transition-all min-h-[44px]"
          >
            <MapPin className="w-3.5 h-3.5 text-ink-3" />
            <span>Live Map</span>
          </Link>
        </div>
      </div>

      {/* Disruption notice banner if active */}
      {activeNotice && (
        <NoticeBanner
          id={activeNotice.id}
          severity={activeNotice.severity}
          title={activeNotice.title}
          message={activeNotice.body}
          timestamp="Live notice"
          routes={activeNotice.routes}
        />
      )}

      {/* Journey Search Card */}
      <div className="rounded-xl border border-line-strong p-4 sm:p-5 bg-paper shadow-xs space-y-4">
        <div className="flex items-center justify-between pb-1 border-b border-line">
          <span className="text-xs font-semibold text-ink-2 uppercase tracking-wider">
            Plan Journey
          </span>
          <span className="text-xs text-ink-4">Tap to change stop</span>
        </div>

        <div className="relative space-y-3">
          {/* Origin field */}
          <div className="flex items-center gap-3">
            <span
              className="w-2.5 h-2.5 rounded-full border-2 border-ink shrink-0 ml-1"
              aria-hidden="true"
            />
            <div className="flex-1">
              <label htmlFor="origin-input" className="sr-only">
                Origin stop or location
              </label>
              <div
                role="button"
                tabIndex={0}
                onClick={() => setPickerTarget("from")}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") setPickerTarget("from");
                }}
                className="w-full text-base font-medium text-ink bg-transparent focus:outline-none placeholder:text-ink-4 placeholder:font-normal h-10 flex items-center cursor-pointer select-none"
              >
                {fromQuery || <span className="text-ink-4 font-normal">{copy.home.fromPlaceholder}</span>}
              </div>
            </div>
            <button
              type="button"
              onClick={handleUseLocation}
              disabled={findingLocation}
              aria-label="Use my current location"
              className="text-xs text-accent flex items-center gap-1 font-medium hover:underline p-1 min-h-[44px] cursor-pointer"
            >
              <LocateFixed className="w-4 h-4 shrink-0" />
              <span className="hidden sm:inline">
                {findingLocation ? "Locating..." : "GPS"}
              </span>
            </button>
          </div>

          {/* Divider with swap button */}
          <div className="relative flex items-center justify-center h-4">
            <div className="w-full border-t border-line" />
            <button
              type="button"
              onClick={handleSwap}
              aria-label="Swap origin and destination"
              className="absolute bg-paper border border-line-strong rounded-full p-2 text-ink-3 hover:text-ink hover:bg-surface-1 transition-colors min-h-[36px] min-w-[36px] flex items-center justify-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent cursor-pointer"
            >
              <ArrowUpDown className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Destination field */}
          <div className="flex items-center gap-3">
            <span
              className="w-2.5 h-2.5 rounded-[1px] bg-ink shrink-0 ml-1"
              aria-hidden="true"
            />
            <div className="flex-1">
              <label htmlFor="dest-input" className="sr-only">
                Destination
              </label>
              <div
                role="button"
                tabIndex={0}
                onClick={() => setPickerTarget("to")}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") setPickerTarget("to");
                }}
                className="w-full text-base font-medium text-ink bg-transparent focus:outline-none placeholder:text-ink-4 placeholder:font-normal h-10 flex items-center cursor-pointer select-none"
              >
                {toQuery || <span className="text-ink-4 font-normal">{copy.home.toPlaceholder}</span>}
              </div>
            </div>
          </div>

          {/* 1-Tap Quick presets for rapid planning */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 pt-1 text-xs">
            <span className="text-ink-4 shrink-0 font-medium">Quick:</span>
            <button
              type="button"
              onClick={() => {
                setFromQuery("Kukatpally Housing Board");
                setSelectedFromStopId(KPHB_STOP_ID);
              }}
              className="px-2.5 py-1 rounded-full bg-surface-2 hover:bg-neutral-200 text-ink shrink-0 font-medium transition-colors"
            >
              From KPHB
            </button>
            <button
              type="button"
              onClick={() => {
                setFromQuery("Miyapur");
                setSelectedFromStopId(MIYAPUR_STOP_ID);
              }}
              className="px-2.5 py-1 rounded-full bg-surface-2 hover:bg-neutral-200 text-ink shrink-0 font-medium transition-colors"
            >
              From Miyapur
            </button>
            <button
              type="button"
              onClick={() => {
                setFromQuery("JNTU Metro");
                setSelectedFromStopId(JNTU_STOP_ID);
              }}
              className="px-2.5 py-1 rounded-full bg-surface-2 hover:bg-neutral-200 text-ink shrink-0 font-medium transition-colors"
            >
              From JNTU
            </button>
            <button
              type="button"
              onClick={() => {
                setFromQuery("Secunderabad Station");
                setSelectedFromStopId(SECUNDERABAD_STOP_ID);
              }}
              className="px-2.5 py-1 rounded-full bg-surface-2 hover:bg-neutral-200 text-ink shrink-0 font-medium transition-colors"
            >
              From Secunderabad
            </button>
            <button
              type="button"
              onClick={() => {
                setToQuery("Main Campus");
                setSelectedToStopId(MAIN_CAMPUS_ID);
              }}
              className="px-2.5 py-1 rounded-full bg-accent-tint hover:bg-accent/20 text-accent border border-accent/20 shrink-0 font-medium transition-colors"
            >
              To Main Campus
            </button>
          </div>
        </div>

        {/* Time mode segmented control */}
        <div className="pt-2 border-t border-line flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <Segmented
            name="Time Mode"
            value={timeMode}
            onChange={(val) => setTimeMode(val as any)}
            options={[
              { value: "now", label: copy.timeMode.now },
              { value: "depart", label: copy.timeMode.depart },
              { value: "arrive", label: copy.timeMode.arrive },
            ]}
          />

          {timeMode !== "now" && (
            <input
              type="time"
              value={selectedTime}
              onChange={(e) => setSelectedTime(e.target.value)}
              aria-label="Selected departure or arrival time"
              className="h-10 px-3 rounded-md border border-line-strong bg-paper text-sm text-ink tabular-nums focus:outline-none focus:ring-2 focus:ring-accent"
            />
          )}
        </div>

        {/* Find buses primary CTA (48px high) */}
        <Button
          size="lg"
          variant="primary"
          onClick={handleFindBuses}
          className="w-full text-base font-semibold min-h-[48px]"
        >
          {copy.home.findBuses}
        </Button>
      </div>

      {/* Live Upcoming Departures Preview (Instant student convenience) */}
      <div className="space-y-3 pt-1">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-accent" />
            <h2 className="text-sm font-semibold text-ink uppercase tracking-wider">
              Upcoming at KPHB Colony
            </h2>
          </div>
          <Link
            href={`/stops/${KPHB_STOP_ID}`}
            className="text-xs font-semibold text-accent hover:underline"
          >
            Full board
          </Link>
        </div>

        {loading ? (
          <div className="space-y-2">
            <Skeleton className="h-14 w-full rounded-lg" />
            <Skeleton className="h-14 w-full rounded-lg" />
          </div>
        ) : liveDepartures.length > 0 ? (
          <div className="border border-line rounded-xl overflow-hidden divide-y divide-line bg-paper">
            {liveDepartures.slice(0, 3).map((dep: any) => (
              <Link
                key={dep.trip_id}
                href={`/routes/${dep.route.code}`}
                className="flex items-center justify-between p-3.5 hover:bg-surface-1 transition-colors min-h-[48px]"
              >
                <div className="flex items-center gap-3">
                  <RouteBadge code={dep.route.code} colorIndex={dep.route.color_index} size="md" />
                  <div>
                    <p className="text-sm font-medium text-ink">{dep.headsign}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-xs text-ink-3 tabular-nums">{dep.time_formatted}</span>
                      <SourceLabel source={dep.expected.source} />
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-sm font-semibold text-ink tabular-nums block">
                    {dep.countdown}
                  </span>
                  {dep.delay_min > 0 && (
                    <span className="text-[11px] font-medium text-warn">+{dep.delay_min}m</span>
                  )}
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="rounded-lg border border-line bg-surface-1 p-4 text-center text-xs text-ink-3">
            Departures load with active routes
          </div>
        )}
      </div>

      {/* Nearby Campus Bus Stops */}
      <div className="space-y-3 pt-1">
        <h2 className="text-sm font-semibold text-ink uppercase tracking-wider">
          Nearby Transit Stops
        </h2>

        {loading ? (
          <div className="space-y-2">
            <Skeleton className="h-12 w-full rounded-md" />
            <Skeleton className="h-12 w-full rounded-md" />
          </div>
        ) : (
          <div className="border border-line rounded-xl overflow-hidden divide-y divide-line bg-paper">
            {stops.slice(0, 4).map((s) => (
              <div
                key={s.id}
                role="button"
                tabIndex={0}
                onClick={() => {
                  setFromQuery(s.name);
                  setSelectedFromStopId(s.id);
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    setFromQuery(s.name);
                    setSelectedFromStopId(s.id);
                  }
                }}
                className="flex items-center justify-between p-3.5 hover:bg-surface-1 transition-colors cursor-pointer min-h-[48px]"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-medium text-ink">{s.name}</h3>
                    {s.is_campus && (
                      <span className="px-1.5 py-0.2 rounded text-[10px] font-semibold bg-accent-tint text-accent">
                        Campus
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-ink-3">{s.landmark || "College bus stop"}</p>
                </div>
                <Link
                  href={`/stops/${s.id}`}
                  onClick={(e) => e.stopPropagation()}
                  className="text-xs font-semibold text-accent hover:underline p-1 min-h-[40px] flex items-center"
                >
                  Departures
                </Link>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Active Campus Routes Directory */}
      <div className="space-y-3 pt-1">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-ink uppercase tracking-wider">
            All Campus Routes ({routes.length})
          </h2>
          <Link href="/map" className="text-xs font-semibold text-accent hover:underline">
            View full network
          </Link>
        </div>

        <div className="grid gap-2.5 sm:grid-cols-2">
          {routes.map((r) => (
            <Link
              key={r.id}
              href={`/routes/${r.code}`}
              className="flex items-center gap-3 p-3.5 rounded-xl border border-line bg-paper hover:bg-surface-1 hover:border-line-strong transition-all duration-120 min-h-[48px]"
            >
              <RouteBadge code={r.code} colorIndex={r.color_index} size="md" />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-ink truncate">{r.name}</p>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className={`text-[11px] font-medium capitalize ${
                    r.status === "active" ? "text-ok" : "text-crit"
                  }`}>
                    {r.status}
                  </span>
                  <span className="text-[11px] text-ink-4">• {r.stop_count || 4} stops</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Place Picker Full-screen Sheet */}
      <PlacePickerSheet
        isOpen={pickerTarget !== null}
        onClose={() => setPickerTarget(null)}
        title={pickerTarget === "from" ? "Choose Origin Stop" : "Choose Destination Stop"}
        onSelect={(place: SelectedPlace) => {
          if (pickerTarget === "from") {
            setFromQuery(place.name);
            setSelectedFromStopId(
              place.type === "point"
                ? `pt:${place.lat.toFixed(4)},${place.lng.toFixed(4)}`
                : place.id || ""
            );
          } else {
            setToQuery(place.name);
            setSelectedToStopId(place.id || MAIN_CAMPUS_ID);
          }
          setPickerTarget(null);
        }}
      />
    </div>
  );
}
