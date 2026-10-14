"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { CheckCircle, AlertTriangle, Clock, ArrowRight, ShieldCheck, Bus, RefreshCw } from "lucide-react";
import { RouteBadge } from "@/components/transit/route-badge";
import { SourceLabel } from "@/components/transit/source-label";
import { StatusTag } from "@/components/transit/status-tag";

export default function AdminDashboardPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [verifying, setVerifying] = useState(false);
  const [verifiedSuccess, setVerifiedSuccess] = useState(false);

  const loadDashboard = () => {
    setLoading(true);
    fetch("/api/v1/admin/dashboard")
      .then((res) => res.json())
      .then((res) => {
        setData(res);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });
  };

  useEffect(() => {
    loadDashboard();
  }, []);

  const handleVerifyRoute = async (routeId: string) => {
    setVerifying(true);
    try {
      await fetch(`/api/v1/admin/routes/${routeId}/verify`, { method: "POST" });
      setVerifiedSuccess(true);
      setTimeout(() => {
        setVerifying(false);
        loadDashboard();
      }, 800);
    } catch {
      setVerifying(false);
    }
  };

  const handleQuickCancel = async (instanceId: string) => {
    const reason = prompt("Enter cancellation reason for students:", "Driver emergency maintenance");
    if (!reason) return;
    setActionLoading(instanceId);
    try {
      await fetch(`/api/v1/admin/trip-instances/${instanceId}/cancel`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason, notify: true }),
      });
      loadDashboard();
    } finally {
      setActionLoading(null);
    }
  };

  const handleQuickDelay = async (instanceId: string) => {
    const mins = prompt("Minutes of delay:", "10");
    if (!mins) return;
    const reason = prompt("Reason for delay:", "Heavy congestion on Ring Road") || "Traffic delay";
    setActionLoading(instanceId);
    try {
      await fetch(`/api/v1/admin/trip-instances/${instanceId}/delay`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ delay_min: parseInt(mins, 10), reason, notify: true }),
      });
      loadDashboard();
    } finally {
      setActionLoading(null);
    }
  };

  if (loading || !data) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-64 bg-neutral-200 animate-pulse rounded" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="h-28 bg-neutral-200 animate-pulse rounded-lg" />
          <div className="h-28 bg-neutral-200 animate-pulse rounded-lg" />
          <div className="h-28 bg-neutral-200 animate-pulse rounded-lg" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-6xl">
      {/* Title greeting */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-serif text-3xl font-normal tracking-tight text-ink">
            Good morning, Mr. Rao
          </h1>
          <p className="text-sm text-ink-3 mt-0.5">
            Fleet status, live route tracking, and daily timetable operations.
          </p>
        </div>
        <button
          type="button"
          onClick={loadDashboard}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-line bg-paper hover:bg-neutral-50 text-xs font-semibold text-ink"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Refresh</span>
        </button>
      </div>

      {/* 3 Summary Blocks: Separated by hairlines (per design spec: not stacked cards with shadows) */}
      <div className="grid grid-cols-1 md:grid-cols-3 rounded-xl border border-line bg-paper overflow-hidden divide-y md:divide-y-0 md:divide-x divide-line">
        <div className="p-6 space-y-1">
          <div className="text-xs font-semibold uppercase tracking-wider text-ink-3">
            Live now
          </div>
          <div className="font-serif text-4xl font-normal text-ink">
            {data.running_trips} trips
          </div>
          <div className="text-xs text-accent font-medium pt-1 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-accent animate-ping" />
            <span>{data.live_buses} broadcasting GPS</span>
          </div>
        </div>

        <div className="p-6 space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-ink-3">
              Active notices
            </span>
            <Link
              href="/admin/notices"
              className="text-xs font-semibold text-accent hover:underline"
            >
              Manage &rarr;
            </Link>
          </div>
          <div className="font-serif text-4xl font-normal text-ink">
            {data.active_notices}
          </div>
          <div className="text-xs text-ink-3 pt-1">1 disruption, 1 schedule advisory</div>
        </div>

        <div className="p-6 space-y-1">
          <div className="text-xs font-semibold uppercase tracking-wider text-warn">
            Needs attention
          </div>
          <div className="font-serif text-4xl font-normal text-ink">
            {data.routes_needing_verification} route
          </div>
          <div className="text-xs text-ink-3 pt-1">Schedule pending verification</div>
        </div>
      </div>

      {/* Needs verification alert banner if any */}
      {data.routes_status && data.routes_status.length > 0 && !verifiedSuccess && (
        <div className="p-4 rounded-xl border border-amber-300 bg-amber-50/70 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-700 shrink-0" />
            <div>
              <div className="text-sm font-semibold text-amber-950">
                Route {data.routes_status[0].code} ({data.routes_status[0].name}) requires verification
              </div>
              <div className="text-xs text-amber-800">
                Last verified {data.routes_status[0].last_verified}. Students see an &ldquo;Aging&rdquo; status badge.
              </div>
            </div>
          </div>
          <button
            type="button"
            disabled={verifying}
            onClick={() => handleVerifyRoute(data.routes_status[0].id)}
            className="px-3.5 py-1.5 rounded-lg bg-amber-700 hover:bg-amber-800 text-white text-xs font-semibold shadow-xs transition-colors shrink-0"
          >
            {verifying ? "Verifying..." : "Verify Route Now"}
          </button>
        </div>
      )}

      {verifiedSuccess && (
        <div className="p-4 rounded-xl border border-emerald-300 bg-emerald-50 text-emerald-900 text-sm font-medium flex items-center gap-2">
          <CheckCircle className="w-4 h-4 text-emerald-700" />
          <span>Route successfully verified! Audit log entry recorded and student freshness tag updated.</span>
        </div>
      )}

      {/* Today's Trips Live Grid */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-ink">Today&apos;s Operations</h2>
          <Link
            href="/admin/operations"
            className="text-xs font-semibold text-accent hover:underline"
          >
            Full operations view &rarr;
          </Link>
        </div>

        {/* Mobile Trips Cards (< 768px) */}
        <div className="block md:hidden space-y-3">
          {data.trips_today.map((trip: any) => (
            <div
              key={trip.id}
              className="bg-paper border border-line rounded-xl p-4 space-y-3 shadow-xs"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <RouteBadge code={trip.route_code} size="sm" />
                  <span className="font-semibold text-ink text-sm">{trip.route_name}</span>
                </div>
                <span className="font-mono text-xs font-bold tabular-nums text-ink">
                  {trip.time}
                </span>
              </div>

              <div className="flex items-center justify-between text-xs text-ink-3">
                <span className="font-mono">{trip.bus_reg}</span>
                <span>Driver: {trip.driver_name}</span>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-line">
                <div className="flex items-center gap-1.5">
                  <StatusTag
                    status={
                      trip.status === "running"
                        ? "running"
                        : trip.status === "delayed"
                        ? "delayed"
                        : trip.status === "cancelled"
                        ? "cancelled"
                        : "scheduled"
                    }
                    delayMin={trip.delay_min}
                  />
                  <SourceLabel
                    source={
                      trip.tracking === "live"
                        ? "live"
                        : trip.tracking === "stale"
                        ? "estimated"
                        : "scheduled"
                    }
                  />
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    disabled={actionLoading === trip.id || trip.status === "cancelled"}
                    onClick={() => handleQuickDelay(trip.id)}
                    className="px-2.5 py-1 text-xs font-semibold text-amber-700 bg-amber-50 hover:bg-amber-100 rounded border border-amber-200 transition-colors disabled:opacity-40 min-h-[36px]"
                  >
                    Delay
                  </button>
                  <button
                    type="button"
                    disabled={actionLoading === trip.id || trip.status === "cancelled"}
                    onClick={() => handleQuickCancel(trip.id)}
                    className="px-2.5 py-1 text-xs font-semibold text-red-700 bg-red-50 hover:bg-red-100 rounded border border-red-200 transition-colors disabled:opacity-40 min-h-[36px]"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Desktop Table View (>= 768px) */}
        <div className="hidden md:block border border-line rounded-xl bg-paper overflow-hidden">
          <table className="w-full text-left text-sm">
            <thead className="bg-neutral-50/70 border-b border-line text-xs font-semibold text-ink-3 uppercase tracking-wider">
              <tr>
                <th className="py-3 px-4">Time</th>
                <th className="py-3 px-4">Route</th>
                <th className="py-3 px-4">Bus</th>
                <th className="py-3 px-4">Driver</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Tracking</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {data.trips_today.map((trip: any) => (
                <tr key={trip.id} className="hover:bg-neutral-50/50 transition-colors">
                  <td className="py-3.5 px-4 font-mono font-medium tabular-nums text-ink">
                    {trip.time}
                  </td>
                  <td className="py-3.5 px-4">
                    <div className="flex items-center gap-2">
                      <RouteBadge code={trip.route_code} size="sm" />
                      <span className="font-medium text-ink">{trip.route_name}</span>
                    </div>
                  </td>
                  <td className="py-3.5 px-4 font-mono text-xs text-ink-2">{trip.bus_reg}</td>
                  <td className="py-3.5 px-4 text-ink-2">{trip.driver_name}</td>
                  <td className="py-3.5 px-4">
                    <StatusTag
                      status={
                        trip.status === "running"
                          ? "running"
                          : trip.status === "delayed"
                          ? "delayed"
                          : trip.status === "cancelled"
                          ? "cancelled"
                          : "scheduled"
                      }
                      delayMin={trip.delay_min}
                    />
                  </td>
                  <td className="py-3.5 px-4">
                    <SourceLabel
                      source={
                        trip.tracking === "live"
                          ? "live"
                          : trip.tracking === "stale"
                          ? "estimated"
                          : "scheduled"
                      }
                    />
                  </td>
                  <td className="py-3.5 px-4 text-right space-x-1.5">
                    <button
                      type="button"
                      disabled={actionLoading === trip.id || trip.status === "cancelled"}
                      onClick={() => handleQuickDelay(trip.id)}
                      className="px-2.5 py-1 text-xs font-semibold text-amber-700 bg-amber-50 hover:bg-amber-100 rounded border border-amber-200 transition-colors disabled:opacity-40"
                    >
                      Delay
                    </button>
                    <button
                      type="button"
                      disabled={actionLoading === trip.id || trip.status === "cancelled"}
                      onClick={() => handleQuickCancel(trip.id)}
                      className="px-2.5 py-1 text-xs font-semibold text-red-700 bg-red-50 hover:bg-red-100 rounded border border-red-200 transition-colors disabled:opacity-40"
                    >
                      Cancel
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
