"use client";

import React, { useState, useEffect } from "react";
import { AlertCircle, Clock, Bus, RefreshCw, CheckCircle, ShieldAlert } from "lucide-react";
import { RouteBadge } from "@/components/transit/route-badge";
import { SourceLabel } from "@/components/transit/source-label";
import { StatusTag } from "@/components/transit/status-tag";

export default function AdminOperationsPage() {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
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
    setReason(mode === "cancel" ? "Bus mechanical fault" : "Traffic congestion on main artery");
    setDelayMinutes(10);
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
            ? `Trip cancelled. Notice drafted and audit log recorded.`
            : `Trip delayed by ${delayMinutes} min. Audit log recorded.`
        );
        setTimeout(() => setSuccessToast(""), 4000);
        setModalMode(null);
        setSelectedTrip(null);
        loadOperations();
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-6xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-serif text-3xl font-normal tracking-tight text-ink">
            Day-of Operations
          </h1>
          <p className="text-sm text-ink-3">
            Real-time interventions for today&apos;s scheduled and running trips.
          </p>
        </div>
        <button
          type="button"
          onClick={loadOperations}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-line bg-paper hover:bg-neutral-50 text-xs font-semibold text-ink"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Refresh</span>
        </button>
      </div>

      {successToast && (
        <div className="p-4 rounded-xl border border-emerald-300 bg-emerald-50 text-emerald-900 text-sm font-medium flex items-center gap-2">
          <CheckCircle className="w-4 h-4 text-emerald-700" />
          <span>{successToast}</span>
        </div>
      )}

      {/* Operations Table */}
      <div className="border border-line rounded-xl bg-paper overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead className="bg-neutral-50/70 border-b border-line text-xs font-semibold text-ink-3 uppercase tracking-wider">
            <tr>
              <th className="py-3 px-4">Scheduled</th>
              <th className="py-3 px-4">Route & Direction</th>
              <th className="py-3 px-4">Vehicle</th>
              <th className="py-3 px-4">Driver</th>
              <th className="py-3 px-4">Operational Status</th>
              <th className="py-3 px-4">Signal</th>
              <th className="py-3 px-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {items.map((item) => (
              <tr key={item.id} className="hover:bg-neutral-50/50 transition-colors">
                <td className="py-3.5 px-4 font-mono font-medium tabular-nums text-ink">
                  {item.scheduled_time}
                </td>
                <td className="py-3.5 px-4">
                  <div className="flex items-center gap-2">
                    <RouteBadge code={item.route_code} size="sm" />
                    <span className="text-xs text-ink-2">
                      {item.direction === "to_campus" ? "To campus" : "From campus"}
                    </span>
                  </div>
                </td>
                <td className="py-3.5 px-4 font-mono text-xs text-ink-2">{item.bus_reg}</td>
                <td className="py-3.5 px-4 text-ink-2">{item.driver_name}</td>
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
                    <div className="text-[11px] text-red-700 mt-0.5">{item.cancel_reason}</div>
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
                <td className="py-3.5 px-4 text-right space-x-1.5">
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
            ))}
          </tbody>
        </table>
      </div>

      {/* Modal Dialog for Cancel / Delay Action */}
      {modalMode && selectedTrip && (
        <div className="fixed inset-0 z-50 bg-neutral-950/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-paper border border-line rounded-xl shadow-xl max-w-md w-full p-6 space-y-5 animate-in fade-in zoom-in-95 duration-150">
            <div>
              <h3 className="font-serif text-2xl font-normal text-ink">
                {modalMode === "cancel" ? "Cancel Trip Instance" : "Record Service Delay"}
              </h3>
              <p className="text-xs text-ink-3 mt-1">
                {selectedTrip.route_code} ({selectedTrip.scheduled_time}) &bull; {selectedTrip.bus_reg}
              </p>
            </div>

            <form onSubmit={handleActionSubmit} className="space-y-4">
              {modalMode === "delay" && (
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-ink-2 mb-1">
                    Delay in Minutes
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="180"
                    value={delayMinutes}
                    onChange={(e) => setDelayMinutes(parseInt(e.target.value, 10))}
                    className="w-full h-10 px-3 border border-line rounded-lg text-sm text-ink focus:outline-accent"
                    required
                  />
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-ink-2 mb-1">
                  Reason (shown to students)
                </label>
                <textarea
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  rows={3}
                  className="w-full p-2.5 border border-line rounded-lg text-sm text-ink focus:outline-accent"
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
                  className="w-4 h-4 rounded border-line text-accent focus:ring-accent"
                />
                <label htmlFor="notifyToggle" className="text-xs text-ink font-medium select-none cursor-pointer">
                  Draft disruption notice for students following this route
                </label>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-line">
                <button
                  type="button"
                  onClick={() => setModalMode(null)}
                  className="px-4 py-2 rounded-lg border border-line text-xs font-semibold text-ink-2 hover:bg-neutral-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className={`px-4 py-2 rounded-lg text-xs font-semibold text-white shadow-xs ${
                    modalMode === "cancel" ? "bg-red-700 hover:bg-red-800" : "bg-accent hover:bg-accent/90"
                  }`}
                >
                  {submitting
                    ? "Applying..."
                    : modalMode === "cancel"
                    ? "Confirm Cancellation"
                    : "Apply Delay"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
