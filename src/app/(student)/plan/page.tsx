"use client";

import * as React from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { ChevronLeft, AlertCircle, Map as MapIcon, List } from "lucide-react";
import { Button } from "@/components/ui/button";
import { JourneyCard } from "@/components/transit/journey-card";
import { Skeleton } from "@/components/ui/skeleton";
import { MapView } from "@/components/map/map-view";
import { api } from "@/lib/api";
import { JourneyOption, PlanResult } from "@/domain/types";

function PlanResultsContent() {
  const searchParams = useSearchParams();
  const fromParam = searchParams.get("from") || "";
  const toParam = searchParams.get("to") || undefined;
  const mode = searchParams.get("mode") || "now";
  const at = searchParams.get("at") || undefined;
  const walkMax = searchParams.get("walk_max");

  const [result, setResult] = React.useState<PlanResult | null>(null);
  const [selectedId, setSelectedId] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [mobileView, setMobileView] = React.useState<"list" | "map">("list");

  React.useEffect(() => {
    if (!fromParam) return;
    let isMounted = true;
    setLoading(true);

    api.plan
      .search({
        from: fromParam,
        to: toParam,
        mode,
        at,
        walkMax: walkMax ? parseInt(walkMax, 10) : 800,
      })
      .then((res: PlanResult) => {
        if (!isMounted) return;
        setResult(res);
        if (res.options.length > 0) {
          setSelectedId(res.options[0].id);
        }
        setLoading(false);
      })
      .catch((err) => {
        if (!isMounted) return;
        setError(err.message || "Failed to search for journey options");
        setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [fromParam, toParam, mode, at, walkMax]);

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto p-4 sm:p-6 space-y-4">
        <Skeleton className="h-8 w-24" />
        <Skeleton className="h-6 w-1/2" />
        <div className="space-y-3">
          <Skeleton className="h-36 w-full rounded-lg" />
          <Skeleton className="h-36 w-full rounded-lg" />
        </div>
      </div>
    );
  }

  if (error || !result) {
    return (
      <div className="max-w-md mx-auto p-8 text-center space-y-4">
        <h2 className="font-serif text-2xl font-normal text-ink">Search Error</h2>
        <p className="text-sm text-ink-3">{error || "Could not retrieve route suggestions."}</p>
        <Link href="/">
          <Button variant="secondary">Back to Search</Button>
        </Link>
      </div>
    );
  }

  const { options, reason, nearest_origin_stop, suggestion } = result;
  const selectedOption = options.find((opt) => opt.id === selectedId) || options[0];

  // Stops for map view from option
  const mapStops = selectedOption
    ? [
        {
          id: selectedOption.board.stop.id,
          name: selectedOption.board.stop.name,
          lat: selectedOption.board.stop.lat,
          lng: selectedOption.board.stop.lng,
        },
        {
          id: selectedOption.alight.stop.id,
          name: selectedOption.alight.stop.name,
          lat: selectedOption.alight.stop.lat,
          lng: selectedOption.alight.stop.lng,
        },
      ]
    : [];

  return (
    <div className="relative min-h-[calc(100vh-4rem)] flex flex-col md:flex-row">
      {/* Left panel on desktop (420px), normal container on mobile */}
      <div className="w-full md:w-[420px] md:min-w-[420px] md:h-[calc(100vh-4rem)] md:overflow-y-auto border-r border-line p-4 sm:p-6 space-y-6 bg-paper z-10">
        {/* Back button and view toggle */}
        <div className="flex items-center justify-between">
          <Link
            href="/"
            className="inline-flex items-center gap-1 text-sm font-medium text-ink-3 hover:text-ink min-h-[44px] py-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent rounded-sm"
          >
            <ChevronLeft className="w-4 h-4" />
            <span>Change search</span>
          </Link>

          {/* Mobile map/list switch button */}
          <div className="md:hidden">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setMobileView(mobileView === "list" ? "map" : "list")}
              className="flex items-center gap-1.5"
            >
              {mobileView === "list" ? (
                <>
                  <MapIcon className="w-3.5 h-3.5" />
                  <span>Map</span>
                </>
              ) : (
                <>
                  <List className="w-3.5 h-3.5" />
                  <span>Cards</span>
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Results header */}
        <div>
          <h1 className="font-serif text-2xl sm:text-3xl font-normal tracking-tight text-ink">
            {options.length > 0
              ? `${options.length} Option${options.length === 1 ? "" : "s"}`
              : "No Direct Buses Found"}
          </h1>
          <p className="text-sm text-ink-3 mt-1 capitalize">
            Mode: {mode === "now" ? "Leave now" : mode === "depart" ? "Leave at" : "Arrive by"}
          </p>
        </div>

        {/* S3b: No results explanation */}
        {options.length === 0 && (
          <div className="rounded-lg border border-line bg-s1 p-6 space-y-4 select-none">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-warn shrink-0 mt-0.5" />
              <div className="space-y-1">
                <h3 className="text-base font-semibold text-ink">
                  {reason === "no_stop_near_origin"
                    ? "No bus passes within 800 m of your origin"
                    : reason === "no_stop_near_destination"
                    ? "No bus stop near destination"
                    : reason === "no_service_remaining_today"
                    ? "No more buses today on connecting routes"
                    : "No direct bus connects these locations"}
                </h3>
                {nearest_origin_stop && (
                  <p className="text-sm text-ink-2">
                    The closest stop is {nearest_origin_stop.stop.name},{" "}
                    {Math.round(nearest_origin_stop.distance_m)} m away.
                  </p>
                )}
                {suggestion && <p className="text-sm text-ink-3">{suggestion}</p>}
              </div>
            </div>

            <div className="pt-2 flex flex-wrap gap-2.5">
              {nearest_origin_stop && (
                <Link href={`/stops/${nearest_origin_stop.stop.id}`}>
                  <Button variant="secondary" size="sm">
                    Show {nearest_origin_stop.stop.name}
                  </Button>
                </Link>
              )}
              <Link href={`/plan?from=${fromParam}&walk_max=1500&mode=${mode}`}>
                <Button variant="secondary" size="sm">
                  Widen walk to 1.5 km
                </Button>
              </Link>
            </div>
          </div>
        )}

        {/* S3: Ranked journey option cards */}
        {options.length > 0 && (
          <div className={`space-y-3 ${mobileView === "map" ? "hidden md:block" : "block"}`}>
            {options.map((opt) => (
              <div key={opt.id}>
                <JourneyCard
                  option={opt}
                  isSelected={selectedId === opt.id}
                  onSelect={() => setSelectedId(opt.id)}
                />
                {selectedId === opt.id && (
                  <div className="mt-2 pl-2 flex items-center justify-between">
                    <Link
                      href={`/routes/${opt.route.code}`}
                      className="text-xs font-semibold text-accent underline py-1"
                    >
                      View full timetable for {opt.route.code}
                    </Link>
                    <span className="text-xs text-ink-3">
                      Arrive at {opt.alight.stop.name}
                    </span>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Map Pane: Fills remaining width on desktop; shows full or overlay on mobile */}
      <div
        className={`flex-1 min-h-[350px] md:h-[calc(100vh-4rem)] relative ${
          mobileView === "list" ? "hidden md:block" : "block h-[60vh] md:h-auto"
        }`}
      >
        <MapView
          stops={mapStops}
          selectedStopId={selectedOption?.board.stop.id}
          journeyGeometry={selectedOption?.geometry}
          center={
            selectedOption
              ? [selectedOption.board.stop.lng, selectedOption.board.stop.lat]
              : [78.4867, 17.44]
          }
          zoom={13}
          className="w-full h-full"
        />
      </div>
    </div>
  );
}

export default function PlanResultsPage() {
  return (
    <React.Suspense
      fallback={
        <div className="max-w-2xl mx-auto p-4 sm:p-6 space-y-4">
          <Skeleton className="h-8 w-24" />
          <Skeleton className="h-6 w-1/2" />
          <div className="space-y-3">
            <Skeleton className="h-36 w-full rounded-lg" />
            <Skeleton className="h-36 w-full rounded-lg" />
          </div>
        </div>
      }
    >
      <PlanResultsContent />
    </React.Suspense>
  );
}
