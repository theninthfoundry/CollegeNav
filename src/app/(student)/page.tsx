"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowUpDown, LocateFixed, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Segmented } from "@/components/ui/segmented";
import { RouteBadge } from "@/components/transit/route-badge";
import { NoticeBanner } from "@/components/transit/notice-banner";
import { Skeleton } from "@/components/ui/skeleton";
import { PlacePickerSheet, SelectedPlace } from "@/components/student/place-picker-sheet";
import { api } from "@/lib/api";
import { copy } from "@/copy/en";

export default function StudentHomePage() {
  const router = useRouter();

  const [fromQuery, setFromQuery] = React.useState("");
  const [toQuery, setToQuery] = React.useState("");
  const [selectedFromStopId, setSelectedFromStopId] = React.useState<string>("");
  const [selectedToStopId, setSelectedToStopId] = React.useState<string>("");
  const [pickerTarget, setPickerTarget] = React.useState<"from" | "to" | null>(null);

  const [timeMode, setTimeMode] = React.useState<"now" | "depart" | "arrive">("now");
  const [selectedTime, setSelectedTime] = React.useState("07:30");

  const [stops, setStops] = React.useState<any[]>([]);
  const [activeNotice, setActiveNotice] = React.useState<any>(null);
  const [routes, setRoutes] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [findingLocation, setFindingLocation] = React.useState(false);

  React.useEffect(() => {
    let isMounted = true;

    Promise.all([
      api.stops.search({ limit: 10 }),
      api.notices.list({ limit: 1 }),
      api.routes.list(),
    ])
      .then(([stopsRes, noticesRes, routesRes]) => {
        if (!isMounted) return;
        setStops(stopsRes.items || []);
        if (noticesRes.items?.length > 0) {
          setActiveNotice(noticesRes.items[0]);
        }
        setRoutes(routesRes.items || []);

        // Default "To" to campus stop
        const campus = stopsRes.items?.find((s: any) => s.is_campus);
        if (campus) {
          setToQuery(campus.name);
          setSelectedToStopId(campus.id);
        }

        // Default "From" to first popular stop (e.g. KPHB or Miyapur)
        const defaultFrom = stopsRes.items?.find((s: any) => s.code === "KPHB") || stopsRes.items?.[1];
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
    const toParam = selectedToStopId ? `stop:${selectedToStopId}` : undefined;

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

  return (
    <div className="max-w-2xl mx-auto p-4 sm:p-6 space-y-6">
      {/* Hero display heading */}
      <div className="pt-2">
        <h1 className="font-serif text-3xl sm:text-4xl md:text-5xl font-normal tracking-tight text-ink">
          {copy.home.heading}
        </h1>
        <p className="text-sm text-ink-3 mt-1">
          Direct campus buses with live location and verified timetables.
        </p>
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

      {/* Search card */}
      <div className="rounded-lg border border-line-strong p-4 bg-paper shadow-xs space-y-4">
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
              className="text-xs text-accent flex items-center gap-1 font-medium hover:underline p-1 min-h-[36px] cursor-pointer"
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
              className="absolute bg-paper border border-line-strong rounded-full p-1.5 text-ink-3 hover:text-ink hover:bg-s1 transition-colors min-h-[32px] min-w-[32px] flex items-center justify-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent cursor-pointer"
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
          className="w-full text-base font-semibold"
        >
          {copy.home.findBuses}
        </Button>
      </div>

      {/* Near you / Suggested stops */}
      <div className="space-y-3 pt-2">
        <h2 className="text-sm font-semibold text-ink uppercase tracking-wider">
          Nearby Stops
        </h2>

        {loading ? (
          <div className="space-y-2">
            <Skeleton className="h-12 w-full rounded-md" />
            <Skeleton className="h-12 w-full rounded-md" />
          </div>
        ) : (
          <div className="border border-line rounded-lg overflow-hidden divide-y divide-line bg-paper">
            {stops.slice(1, 4).map((s) => (
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
                className="flex items-center justify-between p-3.5 hover:bg-s1 transition-colors cursor-pointer min-h-[44px]"
              >
                <div>
                  <h3 className="text-sm font-medium text-ink">{s.name}</h3>
                  <p className="text-xs text-ink-3">{s.landmark || "College bus stop"}</p>
                </div>
                <Link
                  href={`/stops/${s.id}`}
                  onClick={(e) => e.stopPropagation()}
                  className="text-xs font-semibold text-accent hover:underline p-1"
                >
                  View departures
                </Link>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Active Campus Routes */}
      <div className="space-y-3 pt-2">
        <h2 className="text-sm font-semibold text-ink uppercase tracking-wider">
          All Routes ({routes.length})
        </h2>

        <div className="grid gap-2.5 sm:grid-cols-2">
          {routes.map((r) => (
            <Link
              key={r.id}
              href={`/routes/${r.code}`}
              className="flex items-center gap-3 p-3 rounded-lg border border-line bg-paper hover:bg-s1 hover:border-line-strong transition-all duration-120 min-h-[44px]"
            >
              <RouteBadge code={r.code} colorIndex={r.color_index} size="md" />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-ink truncate">{r.name}</p>
                <p className="text-xs text-ink-3 capitalize">{r.status}</p>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Place Picker Full-screen Sheet */}
      <PlacePickerSheet
        isOpen={pickerTarget !== null}
        onClose={() => setPickerTarget(null)}
        title={pickerTarget === "from" ? "Choose Origin" : "Choose Destination"}
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
            setSelectedToStopId(place.id || "");
          }
          setPickerTarget(null);
        }}
      />
    </div>
  );
}
