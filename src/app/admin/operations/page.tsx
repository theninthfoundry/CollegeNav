"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
  AlertCircle,
  Clock,
  Bus,
  RefreshCw,
  CheckCircle,
  ShieldAlert,
  Search,
  Phone,
  Filter,
  Check,
  ChevronRight,
  Radio,
  MapPin,
} from "lucide-react";
import { RouteBadge } from "@/components/transit/route-badge";
import { SourceLabel } from "@/components/transit/source-label";
import { StatusTag } from "@/components/transit/status-tag";

export default function AdminOperationsPage() {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [corridorFilter, setCorridorFilter] = useState<string>("all");

  const [selectedTrip, setSelectedTrip] = useState<any | null>(null);
  const [modalMode, setModalMode] = useState<"cancel" | "delay" | null>(null);
  const [reason, setReason] = useState("");
  const [delayMinutes, setDelayMinutes] = useState(10);
  const [notifyFollowers, setNotifyFollowers] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [successToast, setSuccessToast] = useState("");

  const loadOperations = () => {
    setLoading(true);
    fetch("/api/v1/admin/operations/today")
      .then((res) => res.json())
      .then((res) => {
        setItems(res.items || []);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });
  };

  useEffect(() => {
    loadOperations();
  }, []);

  const openActionModal = (trip: any, mode: "cancel" | "delay") => {
    setSelectedTrip(trip);
    setModalMode(mode);
    setReason(
      mode === "cancel"
        ? "Bus mechanical fault - backup vehicle en route"
        : "Heavy traffic along corridor arterial road"
    );
    setDelayMinutes(mode === "delay" ? 10 : 0);
    setNotifyFollowers(true);
  };

  const handleActionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTrip || !modalMode) return;
    setSubmitting(true);

    try {
      const endpoint =
        modalMode === "cancel"
          ? `/api/v1/admin/trip-instances/${selectedTrip.id}/cancel`
          : `/api/v1/admin/trip-instances/${selectedTrip.id}/delay`;

      const payload =
        modalMode === "cancel"
          ? { reason, notify: notifyFollowers }
          : { delay_min: delayMinutes, reason, notify: notifyFollowers };

      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        setSuccessToast(
          modalMode === "cancel"
            ? `${selectedTrip.route_code} cancelled. Student disruption notice drafted & audit recorded.`
            : `${selectedTrip.route_code} delayed by ${delayMinutes} min. Audit recorded.`
        );
        setTimeout(() => setSuccessToast(""), 5000);
        setModalMode(null);
        setSelectedTrip(null);
        loadOperations();
      }
    } finally {
      setSubmitting(false);
    }
  };

  // Filtered operational trips
  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      // Status filter
      if (statusFilter !== "all") {
        if (statusFilter === "running" && item.status !== "running") return false;
        if (statusFilter === "delayed" && item.status !== "delayed") return false;
        if (statusFilter === "scheduled" && item.status !== "scheduled") return false;
        if (statusFilter === "cancelled" && item.status !== "cancelled") return false;
      }

      // Corridor filter
      if (corridorFilter !== "all") {
        if (!item.corridor || !item.corridor.toLowerCase().includes(corridorFilter.toLowerCase())) {
          return false;
        }
      }

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchCode = item.route_code?.toLowerCase().includes(q);
        const matchDriver = item.driver_name?.toLowerCase().includes(q);
        const matchPhone = item.driver_phone?.toLowerCase().includes(q);
        const matchOrigin = item.origin?.toLowerCase().includes(q);
        const matchCorridor = item.corridor?.toLowerCase().includes(q);
        const matchVehicle = item.bus_reg?.toLowerCase().includes(q);
        return matchCode || matchDriver || matchPhone || matchOrigin || matchCorridor || matchVehicle;
      }

      return true;
    });
  }, [items, statusFilter, corridorFilter, searchQuery]);

  // Counts
  const counts = useMemo(() => {
    return {
      total: items.length,
      running: items.filter((i) => i.status === "running").length,
      delayed: items.filter((i) => i.status === "delayed").length,
      scheduled: items.filter((i) => i.status === "scheduled").length,
      cancelled: items.filter((i) => i.status === "cancelled").length,
    };
  }, [items]);

  return (
    <div className="space-y-5 max-w-7xl pb-12">
      {/* Page Title & Refresh */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="font-serif text-2xl sm:text-3xl font-normal tracking-tight text-ink">
            Day-of Operations
          </h1>
          <p className="text-xs sm:text-sm text-ink-3">
            Real-time fleet interventions for 54 college bus routes across the Twin Cities.
          </p>
        </div>
        <button
          type="button"
          onClick={loadOperations}
          className="self-start sm:self-auto flex items-center gap-1.5 px-3 py-2 rounded-lg border border-line bg-paper hover:bg-neutral-50 text-xs font-semibold text-ink min-h-[44px]"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
          <span>Refresh Fleet</span>
        </button>
      </div>

      {/* Success Notification Banner */}
      {successToast && (
        <div className="p-3.5 rounded-xl border border-emerald-300 bg-emerald-50 text-emerald-900 text-xs sm:text-sm font-medium flex items-center gap-2 animate-in fade-in">
          <CheckCircle className="w-4 h-4 text-emerald-700 shrink-0" />
          <span>{successToast}</span>
        </div>
      )}

      {/* KPI Metric Chips - Tap to filter */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        <button
          type="button"
          onClick={() => setStatusFilter("all")}
          className={`p-3 rounded-xl border text-left transition-colors min-h-[64px] ${
            statusFilter === "all"
              ? "border-accent bg-accent/5 ring-1 ring-accent"
              : "border-line bg-paper hover:bg-neutral-50"
          }`}
        >
          <div className="text-[11px] font-semibold text-ink-3 uppercase tracking-wider">
            Total Fleet
          </div>
          <div className="font-mono text-xl sm:text-2xl font-bold tabular-nums text-ink mt-0.5">
            {counts.total} <span className="text-xs font-normal text-ink-3">buses</span>
          </div>
        </button>

        <button
          type="button"
          onClick={() => setStatusFilter("running")}
          className={`p-3 rounded-xl border text-left transition-colors min-h-[64px] ${
            statusFilter === "running"
              ? "border-emerald-600 bg-emerald-50/50 ring-1 ring-emerald-600"
              : "border-line bg-paper hover:bg-neutral-50"
          }`}
        >
          <div className="text-[11px] font-semibold text-emerald-800 uppercase tracking-wider flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse" />
            <span>In Service</span>
          </div>
          <div className="font-mono text-xl sm:text-2xl font-bold tabular-nums text-emerald-900 mt-0.5">
            {counts.running}
          </div>
        </button>

        <button
          type="button"
          onClick={() => setStatusFilter("delayed")}
          className={`p-3 rounded-xl border text-left transition-colors min-h-[64px] ${
            statusFilter === "delayed"
              ? "border-amber-600 bg-amber-50/50 ring-1 ring-amber-600"
              : "border-line bg-paper hover:bg-neutral-50"
          }`}
        >
          <div className="text-[11px] font-semibold text-amber-800 uppercase tracking-wider">
            Delayed
          </div>
          <div className="font-mono text-xl sm:text-2xl font-bold tabular-nums text-amber-900 mt-0.5">
            {counts.delayed}
          </div>
        </button>

        <button
          type="button"
          onClick={() => setStatusFilter("cancelled")}
          className={`p-3 rounded-xl border text-left transition-colors min-h-[64px] ${
            statusFilter === "cancelled"
              ? "border-red-600 bg-red-50/50 ring-1 ring-red-600"
              : "border-line bg-paper hover:bg-neutral-50"
          }`}
        >
          <div className="text-[11px] font-semibold text-red-800 uppercase tracking-wider">
            Cancelled
          </div>
          <div className="font-mono text-xl sm:text-2xl font-bold tabular-nums text-red-900 mt-0.5">
            {counts.cancelled}
          </div>
        </button>
      </div>

      {/* Search and Filters Bar */}
      <div className="bg-paper border border-line rounded-xl p-3 sm:p-4 space-y-3">
        <div className="flex flex-col sm:flex-row gap-2.5">
          {/* Search Input */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-ink-3 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search route (R1-R54), driver name, phone, or stop..."
              className="w-full h-11 pl-9 pr-3 text-xs sm:text-sm border border-line rounded-lg text-ink placeholder:text-ink-3 bg-neutral-50/50 focus:bg-paper focus:outline-accent"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs font-semibold text-ink-3 hover:text-ink px-1.5 py-0.5"
              >
                Clear
              </button>
            )}
          </div>

          {/* Corridor Filter */}
          <select
            value={corridorFilter}
            onChange={(e) => setCorridorFilter(e.target.value)}
            className="h-11 px-3 border border-line rounded-lg text-xs sm:text-sm text-ink bg-paper focus:outline-accent min-w-[160px]"
          >
            <option value="all">All Corridors (54 Routes)</option>
            <option value="North">North (Balanagar, Alwal, Jeedimetla)</option>
            <option value="West">West (Mehdipatnam, Gachibowli, Miyapur)</option>
            <option value="Central">Central (RTC X Roads, Abids, Vidyanagar)</option>
            <option value="East">East (Uppal, Tarnaka, Boduppal)</option>
            <option value="South">South (Dilsukhnagar, LB Nagar, Vanasthalipuram)</option>
          </select>
        </div>

        {/* Status Tab Filters for Mobile & Desktop */}
        <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none pt-1">
          {[
            { id: "all", label: `All (${counts.total})` },
            { id: "running", label: `In Service (${counts.running})` },
            { id: "delayed", label: `Delayed (${counts.delayed})` },
            { id: "scheduled", label: `Scheduled (${counts.scheduled})` },
            { id: "cancelled", label: `Cancelled (${counts.cancelled})` },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setStatusFilter(tab.id)}
              className={`whitespace-nowrap px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors min-h-[36px] ${
                statusFilter === tab.id
                  ? "bg-ink text-white"
                  : "bg-neutral-100 text-ink-2 hover:bg-neutral-200"
              }`}
            >
              {tab.label}
            </button>
          ))}
          <span className="text-xs text-ink-3 ml-auto hidden sm:inline tabular-nums">
            Showing {filteredItems.length} of {items.length}
          </span>
        </div>
      </div>

      {/* MOBILE OPERATIONS CARD LAYOUT (< 768px) */}
      <div className="block md:hidden space-y-3">
        {loading ? (
          <div className="p-8 text-center bg-paper border border-line rounded-xl text-xs text-ink-3">
            Loading fleet operations...
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="p-8 text-center bg-paper border border-line rounded-xl space-y-2">
            <p className="text-sm font-medium text-ink">No routes match the selected filter</p>
            <button
              type="button"
              onClick={() => {
                setSearchQuery("");
                setStatusFilter("all");
                setCorridorFilter("all");
              }}
              className="px-3 py-1.5 rounded-lg border border-line text-xs font-semibold text-accent"
            >
              Reset Filters
            </button>
          </div>
        ) : (
          filteredItems.map((item) => (
            <div
              key={item.id}
              className={`bg-paper border rounded-xl p-4 space-y-3 shadow-xs transition-shadow ${
                item.status === "cancelled"
                  ? "border-red-200 bg-red-50/20"
                  : item.status === "delayed"
                  ? "border-amber-200 bg-amber-50/20"
                  : "border-line"
              }`}
            >
              {/* Card Header: Route Badge, Departure, Direction & Signal */}
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2.5">
                  <RouteBadge code={item.route_code} size="md" />
                  <div>
                    <div className="font-mono text-base font-bold tabular-nums text-ink">
                      {item.scheduled_time}
                    </div>
                    <div className="text-[11px] text-ink-3">
                      {item.direction === "to_campus" ? "To Campus" : "From Campus"} &bull; {item.stops_count} stops
                    </div>
                  </div>
                </div>

                <div className="flex flex-col items-end gap-1">
                  <StatusTag
                    status={
                      item.status === "running"
                        ? "running"
                        : item.status === "delayed"
                        ? "delayed"
                        : item.status === "cancelled"
                        ? "cancelled"
                        : "scheduled"
                    }
                    delayMin={item.delay_min}
                  />
                  <SourceLabel
                    source={
                      item.tracking === "live"
                        ? "live"
                        : item.tracking === "stale"
                        ? "estimated"
                        : "scheduled"
                    }
                  />
                </div>
              </div>

              {/* Route Origin & Corridor */}
              <div className="p-2.5 rounded-lg bg-neutral-50 border border-line text-xs space-y-1">
                <div className="flex items-center justify-between text-ink font-semibold">
                  <span>{item.origin} &rarr; College Campus</span>
                  <span className="font-mono text-[11px] text-ink-3 font-normal">{item.bus_reg}</span>
                </div>
                <div className="text-[11px] text-ink-3 flex items-center justify-between">
                  <span>Corridor: {item.corridor}</span>
                  {item.next_stop && (
                    <span className="text-accent font-medium">Next: {item.next_stop}</span>
                  )}
                </div>
              </div>

              {/* Driver & Direct Phone Tap Target */}
              <div className="flex items-center justify-between pt-1">
                <div className="min-w-0">
                  <div className="text-xs font-semibold text-ink truncate">
                    Driver: {item.driver_name}
                  </div>
                  <div className="text-[11px] font-mono text-ink-3 tabular-nums">
                    {item.driver_phone}
                  </div>
                </div>

                {/* 1-Tap Driver Call Link (44px target) */}
                <a
                  href={`tel:${item.driver_phone}`}
                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-line bg-white hover:bg-neutral-50 text-xs font-semibold text-accent min-h-[44px] shadow-xs active:scale-95 transition-transform"
                >
                  <Phone className="w-3.5 h-3.5" />
                  <span>Call</span>
                </a>
              </div>

              {/* Cancellation or Delay Notice description if active */}
              {item.cancel_reason && (
                <div className="p-2 rounded bg-red-100/60 border border-red-200 text-xs text-red-800">
                  <span className="font-semibold">Cancellation:</span> {item.cancel_reason}
                </div>
              )}
              {item.delay_reason && (
                <div className="p-2 rounded bg-amber-100/60 border border-amber-200 text-xs text-amber-900">
                  <span className="font-semibold">Delay Note:</span> {item.delay_reason}
                </div>
              )}

              {/* Action Buttons: 44px touch targets */}
              <div className="grid grid-cols-2 gap-2 pt-1 border-t border-line">
                <button
                  type="button"
                  disabled={item.status === "cancelled"}
                  onClick={() => openActionModal(item, "delay")}
                  className="flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-semibold text-amber-800 bg-amber-50 hover:bg-amber-100 rounded-lg border border-amber-200 transition-colors disabled:opacity-40 min-h-[44px]"
                >
                  <Clock className="w-3.5 h-3.5" />
                  <span>Record Delay</span>
                </button>
                <button
                  type="button"
                  disabled={item.status === "cancelled"}
                  onClick={() => openActionModal(item, "cancel")}
                  className="flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-semibold text-red-700 bg-red-50 hover:bg-red-100 rounded-lg border border-red-200 transition-colors disabled:opacity-40 min-h-[44px]"
                >
                  <AlertCircle className="w-3.5 h-3.5" />
                  <span>Cancel Trip</span>
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* DESKTOP OPERATIONS TABLE LAYOUT (>= 768px) */}
      <div className="hidden md:block border border-line rounded-xl bg-paper overflow-hidden shadow-xs">
        <table className="w-full text-left text-sm">
          <thead className="bg-neutral-50/80 border-b border-line text-xs font-semibold text-ink-3 uppercase tracking-wider">
            <tr>
              <th className="py-3 px-4">Scheduled</th>
              <th className="py-3 px-4">Route & Corridor</th>
              <th className="py-3 px-4">Vehicle</th>
              <th className="py-3 px-4">Driver & Phone</th>
              <th className="py-3 px-4">Operational Status</th>
              <th className="py-3 px-4">Signal</th>
              <th className="py-3 px-4 text-right">Intervention</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {loading ? (
              <tr>
                <td colSpan={7} className="py-8 text-center text-xs text-ink-3">
                  Loading fleet operations...
                </td>
              </tr>
            ) : filteredItems.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-8 text-center text-xs text-ink-3">
                  No routes match the selected filter.
                </td>
              </tr>
            ) : (
              filteredItems.map((item) => (
                <tr key={item.id} className="hover:bg-neutral-50/60 transition-colors">
                  <td className="py-3.5 px-4 font-mono font-medium tabular-nums text-ink whitespace-nowrap">
                    {item.scheduled_time}
                  </td>
                  <td className="py-3.5 px-4">
                    <div className="flex items-center gap-2">
                      <RouteBadge code={item.route_code} size="sm" />
                      <div>
                        <div className="font-medium text-ink text-xs truncate max-w-[200px]">
                          {item.origin}
                        </div>
                        <div className="text-[11px] text-ink-3 truncate max-w-[200px]">
                          {item.corridor}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="py-3.5 px-4 font-mono text-xs text-ink-2 whitespace-nowrap">
                    {item.bus_reg}
                  </td>
                  <td className="py-3.5 px-4">
                    <div className="text-xs font-medium text-ink">{item.driver_name}</div>
                    <a
                      href={`tel:${item.driver_phone}`}
                      className="inline-flex items-center gap-1 font-mono text-[11px] text-accent hover:underline tabular-nums"
                    >
                      <Phone className="w-3 h-3" />
                      <span>{item.driver_phone}</span>
                    </a>
                  </td>
                  <td className="py-3.5 px-4">
                    <StatusTag
                      status={
                        item.status === "running"
                          ? "running"
                          : item.status === "delayed"
                          ? "delayed"
                          : item.status === "cancelled"
                          ? "cancelled"
                          : "scheduled"
                      }
                      delayMin={item.delay_min}
                    />
                    {item.cancel_reason && (
                      <div className="text-[11px] text-red-700 mt-0.5 truncate max-w-[180px]">
                        {item.cancel_reason}
                      </div>
                    )}
                    {item.delay_reason && (
                      <div className="text-[11px] text-amber-800 mt-0.5 truncate max-w-[180px]">
                        {item.delay_reason}
                      </div>
                    )}
                  </td>
                  <td className="py-3.5 px-4">
                    <SourceLabel
                      source={
                        item.tracking === "live"
                          ? "live"
                          : item.tracking === "stale"
                          ? "estimated"
                          : "scheduled"
                      }
                    />
                  </td>
                  <td className="py-3.5 px-4 text-right space-x-1.5 whitespace-nowrap">
                    <button
                      type="button"
                      disabled={item.status === "cancelled"}
                      onClick={() => openActionModal(item, "delay")}
                      className="px-2.5 py-1 text-xs font-semibold text-amber-700 bg-amber-50 hover:bg-amber-100 rounded border border-amber-200 transition-colors disabled:opacity-40"
                    >
                      Delay
                    </button>
                    <button
                      type="button"
                      disabled={item.status === "cancelled"}
                      onClick={() => openActionModal(item, "cancel")}
                      className="px-2.5 py-1 text-xs font-semibold text-red-700 bg-red-50 hover:bg-red-100 rounded border border-red-200 transition-colors disabled:opacity-40"
                    >
                      Cancel
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Accessible Action Modal Dialog for Delay or Cancel */}
      {modalMode && selectedTrip && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 bg-neutral-950/50 backdrop-blur-xs flex items-center justify-center p-4"
        >
          <div className="bg-paper border border-line rounded-2xl shadow-2xl max-w-md w-full p-6 space-y-5 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-serif text-2xl font-normal text-ink">
                  {modalMode === "cancel" ? "Cancel Trip Run" : "Record Route Delay"}
                </h3>
                <p className="text-xs text-ink-3 mt-1">
                  {selectedTrip.route_code} &bull; {selectedTrip.scheduled_time} &bull; Driver: {selectedTrip.driver_name} ({selectedTrip.driver_phone})
                </p>
              </div>
              <RouteBadge code={selectedTrip.route_code} size="md" />
            </div>

            <form onSubmit={handleActionSubmit} className="space-y-4">
              {modalMode === "delay" && (
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-ink-2 mb-1.5">
                    Delay in Minutes
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min="1"
                      max="180"
                      value={delayMinutes}
                      onChange={(e) => setDelayMinutes(parseInt(e.target.value, 10) || 0)}
                      className="w-full h-11 px-3 border border-line rounded-lg text-sm text-ink focus:outline-accent font-mono tabular-nums"
                      required
                    />
                    <div className="flex gap-1">
                      {[5, 10, 15, 20].map((min) => (
                        <button
                          key={min}
                          type="button"
                          onClick={() => setDelayMinutes(min)}
                          className={`px-2.5 py-1 text-xs font-semibold rounded border ${
                            delayMinutes === min
                              ? "bg-accent text-white border-accent"
                              : "border-line bg-neutral-50 text-ink-2"
                          }`}
                        >
                          +{min}m
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-ink-2 mb-1.5">
                  Reason (displayed to students on live commute board)
                </label>
                <textarea
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  rows={3}
                  className="w-full p-3 border border-line rounded-lg text-sm text-ink focus:outline-accent leading-relaxed"
                  required
                />
              </div>

              {/* Notify followers toggle (per spec: on by default) */}
              <div className="flex items-center gap-3 p-3 bg-neutral-50 rounded-lg border border-line">
                <input
                  type="checkbox"
                  id="notifyToggle"
                  checked={notifyFollowers}
                  onChange={(e) => setNotifyFollowers(e.target.checked)}
                  className="w-5 h-5 rounded border-line text-accent focus:ring-accent"
                />
                <label
                  htmlFor="notifyToggle"
                  className="text-xs text-ink font-medium select-none cursor-pointer leading-tight"
                >
                  Draft disruption notice for students following this route
                </label>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-line">
                <button
                  type="button"
                  onClick={() => setModalMode(null)}
                  className="px-4 py-2.5 rounded-lg border border-line text-xs font-semibold text-ink-2 hover:bg-neutral-50 min-h-[44px]"
                >
                  Dismiss
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className={`px-5 py-2.5 rounded-lg text-xs font-semibold text-white shadow-xs min-h-[44px] transition-opacity ${
                    modalMode === "cancel"
                      ? "bg-red-700 hover:bg-red-800"
                      : "bg-accent hover:bg-accent/90"
                  } disabled:opacity-50`}
                >
                  {submitting
                    ? "Applying..."
                    : modalMode === "cancel"
                    ? "Confirm Cancellation"
                    : "Apply Service Delay"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
