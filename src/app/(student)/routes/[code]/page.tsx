"use client";

import * as React from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ChevronLeft, Bell, BellOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Segmented } from "@/components/ui/segmented";
import { RouteBadge } from "@/components/transit/route-badge";
import { FreshnessTag } from "@/components/transit/freshness-tag";
import { SourceLabel } from "@/components/transit/source-label";
import { NoticeBanner } from "@/components/transit/notice-banner";
import { StopTimeline } from "@/components/transit/stop-timeline";
import { Skeleton } from "@/components/ui/skeleton";
import { MapView, MapStop, MapRoute } from "@/components/map/map-view";
import { useToast } from "@/components/ui/toast";
import { api } from "@/lib/api";
import { Direction } from "@/domain/types";

export default function RouteDetailPage() {
  const params = useParams();
  const code = (params?.code as string) || "R1";
  const { toast } = useToast();

  const [direction, setDirection] = React.useState<Direction>("to_campus");
  const [routeData, setRouteData] = React.useState<any>(null);
  const [timetableData, setTimetableData] = React.useState<any>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [following, setFollowing] = React.useState(false);

  React.useEffect(() => {
    let isMounted = true;
    setLoading(true);

    Promise.all([
      api.routes.get(code),
      api.routes.timetable(code, { direction }),
    ])
      .then(([routeRes, ttRes]) => {
        if (!isMounted) return;
        setRouteData(routeRes);
        setTimetableData(ttRes);
        setLoading(false);
      })
      .catch((err) => {
        if (!isMounted) return;
        setError(err.message || "Failed to load route details");
        setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [code, direction]);

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto p-4 sm:p-6 space-y-6">
        <Skeleton className="h-8 w-24" />
        <div className="flex items-center gap-3">
          <Skeleton className="h-9 w-9 rounded-sm" />
          <div className="space-y-1.5 flex-1">
            <Skeleton className="h-6 w-3/4" />
            <Skeleton className="h-4 w-1/3" />
          </div>
        </div>
        <Skeleton className="h-10 w-full rounded-md" />
        <Skeleton className="h-64 w-full rounded-lg" />
      </div>
    );
  }

  if (error || !routeData) {
    return (
      <div className="max-w-md mx-auto p-8 text-center space-y-4">
        <h2 className="font-serif text-2xl font-normal text-ink">Could not load route</h2>
        <p className="text-sm text-ink-3">{error || "The requested route could not be found."}</p>
        <Link href="/">
          <Button variant="secondary">Back to Plan</Button>
        </Link>
      </div>
    );
  }

  const { route, freshness, status, status_reason, directions, notices = [] } = routeData;
  const currentDirectionObj = directions.find((d: any) => d.direction === direction);
  const stops = currentDirectionObj?.stops || [];

  const timelineStops = stops.map((item: any, idx: number) => ({
    stopId: item.stop?.id || `stop-${idx}`,
    name: item.stop?.name || "Stop",
    timeStr: `+${item.offset_min} min`,
    secondaryText: item.stop?.landmark,
    isBoarding: idx === 0,
    isAlighting: idx === stops.length - 1,
  }));

  const isSuspended = status === "suspended";

  return (
    <div className="max-w-2xl mx-auto p-4 sm:p-6 space-y-6">
      {/* Back button */}
      <div>
        <Link
          href="/"
          className="inline-flex items-center gap-1 text-sm font-medium text-ink-3 hover:text-ink min-h-[44px] py-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent rounded-sm"
        >
          <ChevronLeft className="w-4 h-4" />
          <span>Back</span>
        </Link>
      </div>

      {/* Header: Badge, Code & Name */}
      <div className="space-y-2">
        <div className="flex items-center gap-3">
          <RouteBadge code={route.code} colorIndex={route.color_index} size="lg" />
          <h1 className="font-serif text-2xl sm:text-3xl font-normal tracking-tight text-ink">
            {route.name}
          </h1>
        </div>
        <div className="flex items-center gap-3 pt-1">
          <FreshnessTag freshness={freshness} />
        </div>
      </div>

      {/* Suspended route notice */}
      {isSuspended && (
        <NoticeBanner
          id="suspended"
          severity="critical"
          title={`${route.code} is not running`}
          message={status_reason || "This route is currently suspended by transport administration."}
        />
      )}

      {/* Active route notices */}
      {notices.map((n: any) => (
        <NoticeBanner
          key={n.id}
          id={n.id}
          severity={n.severity}
          title={n.title}
          message={n.body}
          timestamp="Active today"
        />
      ))}

      {/* Direction toggle */}
      <div>
        <Segmented
          name="Direction"
          value={direction}
          onChange={(val) => setDirection(val as Direction)}
          options={[
            { value: "to_campus", label: "To campus" },
            { value: "from_campus", label: "From campus" },
          ]}
        />
      </div>

      {/* Route Map Preview (180 px per spec) */}
      <div className="h-48 rounded-lg overflow-hidden border border-line shadow-xs">
        <MapView
          routes={[
            {
              id: route.id,
              code: route.code,
              name: route.name,
              color:
                route.code === "R1"
                  ? "#0F2F6B"
                  : route.code === "R2"
                  ? "#0E5B3D"
                  : route.code === "R3"
                  ? "#9B331A"
                  : "#5B6471",
              lineGeoJson: currentDirectionObj?.line,
            },
          ]}
          stops={stops.map((item: any) => ({
            id: item.stop?.id,
            name: item.stop?.name,
            code: item.stop?.code,
            lat: item.stop?.lat,
            lng: item.stop?.lng,
          }))}
          center={
            stops[0]?.stop?.lng && stops[0]?.stop?.lat
              ? [stops[0].stop.lng, stops[0].stop.lat]
              : [78.4867, 17.44]
          }
          zoom={12}
          className="w-full h-full"
        />
      </div>

      {/* Stop timeline */}
      <div className="border border-line rounded-lg p-4 bg-paper space-y-3">
        <h3 className="text-sm font-semibold text-ink uppercase tracking-wider">
          Stops ({stops.length})
        </h3>
        {stops.length > 0 ? (
          <StopTimeline colorIndex={route.color_index} stops={timelineStops} />
        ) : (
          <p className="text-sm text-ink-3">No stops configured for this direction.</p>
        )}
      </div>

      {/* Timetable grid */}
      {timetableData && timetableData.trips && (
        <div className="border border-line rounded-lg p-4 bg-paper space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-ink uppercase tracking-wider">
              Today&apos;s Timetable
            </h3>
            <span className="text-xs text-ink-3">{timetableData.days_label}</span>
          </div>

          <div className="flex flex-wrap gap-2 pt-1">
            {timetableData.trips.map((t: any) => {
              const isCancelled = t.status === "cancelled";
              return (
                <div
                  key={t.trip_id}
                  className={`px-3 py-2 rounded-md border text-sm font-medium tabular-nums ${
                    isCancelled
                      ? "bg-s2 border-line text-ink-4 line-through"
                      : "bg-s1 border-line-strong text-ink"
                  }`}
                >
                  <span>{t.depart}</span>
                  {isCancelled && <span className="ml-1 text-xs text-crit no-underline">Cancelled</span>}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Follow route button */}
      <div className="pt-2 pb-6">
        <Button
          variant={following ? "secondary" : "primary"}
          size="lg"
          className="w-full"
          onClick={() => {
            const next = !following;
            setFollowing(next);
            toast({
              message: next
                ? `Following ${route.code}. You'll receive disruption notices.`
                : `Unfollowed ${route.code}.`,
            });
          }}
        >
          {following ? (
            <span className="inline-flex items-center gap-2">
              <BellOff className="w-4 h-4" />
              <span>Following {route.code}</span>
            </span>
          ) : (
            <span className="inline-flex items-center gap-2">
              <Bell className="w-4 h-4" />
              <span>Follow route</span>
            </span>
          )}
        </Button>
      </div>
    </div>
  );
}
