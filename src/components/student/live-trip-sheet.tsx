"use client";

import React from "react";
import { X, Bus, Clock, AlertTriangle, ShieldCheck } from "lucide-react";
import { RouteBadge } from "@/components/transit/route-badge";
import { SourceLabel } from "@/components/transit/source-label";
import { StatusTag } from "@/components/transit/status-tag";

export interface LiveTripData {
  trip_instance_id: string;
  route_code: string;
  route_name: string;
  bus_reg: string;
  direction: "to_campus" | "from_campus";
  tracking: "live" | "stale" | "lost" | "not_tracked";
  age_s?: number;
  current_location_desc?: string;
  target_stop_name?: string;
  target_eta_min?: number;
  upcoming_stops?: Array<{
    name: string;
    scheduled_time: string;
    expected_time: string;
    delta_min?: number;
    source: "live" | "estimated" | "scheduled";
  }>;
}

interface LiveTripSheetProps {
  isOpen: boolean;
  onClose: () => void;
  data: LiveTripData | null;
}

export function LiveTripSheet({ isOpen, onClose, data }: LiveTripSheetProps) {
  if (!isOpen || !data) return null;

  const isLive = data.tracking === "live";
  const isStale = data.tracking === "stale";
  const isLost = data.tracking === "lost";

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Live trip details"
      className="fixed inset-x-0 bottom-0 z-50 max-h-[85vh] bg-paper border-t border-line rounded-t-2xl shadow-xl flex flex-col animate-in slide-in-from-bottom duration-300 max-w-xl mx-auto"
    >
      {/* Sheet Grabber */}
      <div className="w-full flex justify-center pt-3 pb-1">
        <div className="w-10 h-1 rounded-full bg-neutral-300" />
      </div>

      {/* Header */}
      <div className="flex items-center justify-between px-5 py-3 border-b border-line">
        <div className="flex items-center gap-3">
          <RouteBadge code={data.route_code} size="md" />
          <div>
            <h3 className="text-base font-semibold text-ink">
              {data.direction === "to_campus" ? "To campus" : "From campus"}
            </h3>
            <div className="text-xs text-ink-3 font-mono">{data.bus_reg}</div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <SourceLabel source={isLive ? "live" : isStale ? "estimated" : "scheduled"} />
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center text-ink hover:bg-neutral-100 transition-colors"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="p-5 overflow-y-auto space-y-5">
        {/* Signal Warning if stale or lost */}
        {isStale && (
          <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg flex items-start gap-2.5">
            <AlertTriangle className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
            <div className="text-xs text-amber-900 leading-relaxed">
              <span className="font-semibold">GPS Signal Aging.</span> Last reported {data.age_s || 45} seconds ago. Arrival times degraded to estimated.
            </div>
          </div>
        )}

        {isLost && (
          <div className="p-3 bg-neutral-100 border border-line rounded-lg flex items-start gap-2.5">
            <Clock className="w-4 h-4 text-ink-3 shrink-0 mt-0.5" />
            <div className="text-xs text-ink-2 leading-relaxed">
              <span className="font-semibold">GPS Signal Lost.</span> Showing timetable scheduled times.
            </div>
          </div>
        )}

        {/* Current position statement */}
        <div className="p-4 bg-neutral-50 rounded-xl border border-line">
          <div className="text-xs text-ink-3 uppercase tracking-wider font-semibold mb-1">
            Current Bus Position
          </div>
          <div className="text-base font-serif text-ink">
            {data.current_location_desc || `En route towards ${data.direction === "to_campus" ? "Main campus" : "Terminus"}`}
          </div>
        </div>

        {/* Target Stop Arrival Hero */}
        {data.target_stop_name && (
          <div className="p-4 rounded-xl border-2 border-accent/20 bg-accent/5">
            <div className="text-xs font-semibold text-accent uppercase tracking-wider mb-1">
              Your Stop: {data.target_stop_name}
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold font-mono tracking-tight text-ink">
                {data.target_eta_min !== undefined ? `${data.target_eta_min} min` : "Approaching"}
              </span>
              <SourceLabel source={isLive ? "live" : "estimated"} />
            </div>
          </div>
        )}

        {/* Upcoming Stops Timeline */}
        {data.upcoming_stops && data.upcoming_stops.length > 0 && (
          <div>
            <h4 className="text-xs font-semibold text-ink-3 uppercase tracking-wider mb-3">
              Upcoming Stops on this run
            </h4>
            <div className="space-y-3">
              {data.upcoming_stops.map((stop, i) => (
                <div key={i} className="flex items-center justify-between text-sm py-1 border-b border-line/50">
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 rounded-full bg-accent" />
                    <span className="font-medium text-ink">{stop.name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-ink tabular-nums">{stop.expected_time}</span>
                    {stop.delta_min !== undefined && stop.delta_min > 0 && (
                      <span className="text-xs font-mono text-amber-700 font-medium">
                        +{stop.delta_min}m
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
