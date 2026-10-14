"use client";

import * as React from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ChevronLeft, Bell, BellOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { RouteBadge } from "@/components/transit/route-badge";
import { DepartureRow } from "@/components/transit/departure-row";
import { NoticeBanner } from "@/components/transit/notice-banner";
import { Skeleton } from "@/components/ui/skeleton";
import { MapView } from "@/components/map/map-view";
import { useToast } from "@/components/ui/toast";
import { api } from "@/lib/api";

export default function StopDetailPage() {
  const params = useParams();
  const id = (params?.id as string) || "";
  const { toast } = useToast();

  const [stopData, setStopData] = React.useState<any>(null);
  const [departures, setDepartures] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [following, setFollowing] = React.useState(false);

  React.useEffect(() => {
    let isMounted = true;
    setLoading(true);

    Promise.all([
      api.stops.get(id),
      api.stops.departures(id, { limit: 12 }),
    ])
      .then(([stopRes, depRes]) => {
        if (!isMounted) return;
        setStopData(stopRes);
        setDepartures(depRes.items || []);
        setLoading(false);
      })
      .catch((err) => {
        if (!isMounted) return;
        setError(err.message || "Failed to load stop details");
        setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [id]);

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto p-4 sm:p-6 space-y-6">
        <Skeleton className="h-8 w-24" />
        <div className="space-y-2">
          <Skeleton className="h-7 w-2/3" />
          <Skeleton className="h-4 w-1/3" />
        </div>
        <Skeleton className="h-44 w-full rounded-lg" />
      </div>
    );
  }

  if (error || !stopData?.stop) {
    return (
      <div className="max-w-md mx-auto p-8 text-center space-y-4">
        <h2 className="font-serif text-2xl font-normal text-ink">Could not load stop</h2>
        <p className="text-sm text-ink-3">{error || "The requested stop could not be found."}</p>
        <Link href="/">
          <Button variant="secondary">Back to Plan</Button>
        </Link>
      </div>
    );
  }

  const { stop, routes = [], notices = [] } = stopData;

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

      {/* Header */}
      <div className="space-y-1">
        <h1 className="font-serif text-2xl sm:text-3xl font-normal tracking-tight text-ink">
          {stop.name}
        </h1>
        {stop.landmark && <p className="text-sm text-ink-3">{stop.landmark}</p>}
        <div className="flex items-center gap-4 pt-2 text-xs text-ink-2">
          <span>Step-free access: {stop.step_free ? "Yes" : "No"}</span>
          {stop.is_campus && (
            <span className="font-semibold text-accent bg-accent-tint px-2 py-0.5 rounded-sm">
              Main Campus
            </span>
          )}
        </div>
      </div>

      {/* Routes serving this stop */}
      {routes.length > 0 && (
        <div className="flex items-center gap-2 pt-1">
          <span className="text-xs font-medium text-ink-3">Routes:</span>
          <div className="flex flex-wrap gap-1.5">
            {routes.map((r: any) => (
              <Link key={r.id} href={`/routes/${r.code}`}>
                <RouteBadge code={r.code} colorIndex={r.color_index} size="md" />
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Stop notices */}
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

      {/* Stop location map pin */}
      <div className="h-44 rounded-lg overflow-hidden border border-line shadow-xs">
        <MapView
          stops={[
            {
              id: stop.id,
              name: stop.name,
              code: stop.code,
              lat: stop.lat,
              lng: stop.lng,
            },
          ]}
          selectedStopId={stop.id}
          center={[stop.lng, stop.lat]}
          zoom={14}
          className="w-full h-full"
        />
      </div>

      {/* Next departures */}
      <div className="space-y-3 pt-2">
        <h3 className="text-sm font-semibold text-ink uppercase tracking-wider">
          Next Departures
        </h3>

        {departures.length > 0 ? (
          <div className="border border-line rounded-lg overflow-hidden divide-y divide-line">
            {departures.map((dep: any, idx: number) => {
              const isCancelled = dep.status === "cancelled";
              return (
                <DepartureRow
                  key={`${dep.trip_id}-${idx}`}
                  route={dep.route}
                  destination={dep.headsign}
                  timeStr={dep.time_formatted}
                  countdownText={dep.countdown}
                  source={dep.expected.source}
                  statusText={dep.status === "delayed" ? `Delayed ${dep.delay_min} min` : undefined}
                  isCancelled={isCancelled}
                  onClick={() =>
                    toast({
                      message: `${dep.route.code} to ${dep.headsign} at ${dep.time_formatted}`,
                    })
                  }
                />
              );
            })}
          </div>
        ) : (
          <div className="p-6 text-center border border-line rounded-lg bg-s1">
            <p className="text-sm text-ink-3">No more scheduled departures today.</p>
          </div>
        )}
      </div>

      {/* Follow stop button */}
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
                ? `Following ${stop.name}. You'll receive stop updates.`
                : `Unfollowed ${stop.name}.`,
            });
          }}
        >
          {following ? (
            <span className="inline-flex items-center gap-2">
              <BellOff className="w-4 h-4" />
              <span>Following stop</span>
            </span>
          ) : (
            <span className="inline-flex items-center gap-2">
              <Bell className="w-4 h-4" />
              <span>Follow stop</span>
            </span>
          )}
        </Button>
      </div>
    </div>
  );
}
