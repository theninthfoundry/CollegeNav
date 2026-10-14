"use client";

import React, { useState } from "react";
import { Check, ShieldCheck, Key, Sliders, Bell } from "lucide-react";

export default function AdminSettingsPage() {
  const [walkRadius, setWalkRadius] = useState(800);
  const [walkSpeed, setWalkSpeed] = useState(1.2);
  const [verifiedDays, setVerifiedDays] = useState(14);
  const [agingDays, setAgingDays] = useState(45);
  const [delayThreshold, setDelayThreshold] = useState(5);
  const [driverPin, setDriverPin] = useState("246810");
  const [saved, setSaved] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="font-serif text-3xl font-normal tracking-tight text-ink">
          Operational Settings
        </h1>
        <p className="text-sm text-ink-3">
          Configure walking calculations, data freshness degradation rules, and driver credentials.
        </p>
      </div>

      {saved && (
        <div className="p-4 rounded-xl border border-emerald-300 bg-emerald-50 text-emerald-900 text-sm font-medium flex items-center gap-2">
          <Check className="w-4 h-4 text-emerald-700" />
          <span>System configuration saved successfully.</span>
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-6 bg-paper p-6 rounded-xl border border-line shadow-xs">
        {/* Section 1: Journey Planner */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-line text-sm font-semibold text-ink">
            <Sliders className="w-4 h-4 text-accent" />
            <span>Journey Planner Defaults</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-ink-3 uppercase tracking-wider mb-1">
                Default Walk Radius (meters)
              </label>
              <input
                type="number"
                min="200"
                max="2000"
                step="50"
                value={walkRadius}
                onChange={(e) => setWalkRadius(parseInt(e.target.value, 10))}
                className="w-full h-10 px-3 border border-line rounded-lg text-sm text-ink font-mono"
              />
              <span className="text-[11px] text-ink-4">Configurable up to 2000m max</span>
            </div>

            <div>
              <label className="block text-xs font-semibold text-ink-3 uppercase tracking-wider mb-1">
                Walking Speed (meters/second)
              </label>
              <input
                type="number"
                min="0.5"
                max="2.5"
                step="0.1"
                value={walkSpeed}
                onChange={(e) => setWalkSpeed(parseFloat(e.target.value))}
                className="w-full h-10 px-3 border border-line rounded-lg text-sm text-ink font-mono"
              />
              <span className="text-[11px] text-ink-4">1.2 m/s = approx 4.3 km/h</span>
            </div>
          </div>
        </div>

        {/* Section 2: Freshness Thresholds */}
        <div className="space-y-4 pt-4">
          <div className="flex items-center gap-2 pb-2 border-b border-line text-sm font-semibold text-ink">
            <ShieldCheck className="w-4 h-4 text-accent" />
            <span>Schedule Freshness Rules (Outcome 08)</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-ink-3 uppercase tracking-wider mb-1">
                &ldquo;Verified&rdquo; Window (days)
              </label>
              <input
                type="number"
                value={verifiedDays}
                onChange={(e) => setVerifiedDays(parseInt(e.target.value, 10))}
                className="w-full h-10 px-3 border border-line rounded-lg text-sm text-ink font-mono"
              />
              <span className="text-[11px] text-ink-4">Routes verified within this window show verified badge</span>
            </div>

            <div>
              <label className="block text-xs font-semibold text-ink-3 uppercase tracking-wider mb-1">
                &ldquo;Aging&rdquo; Window (days)
              </label>
              <input
                type="number"
                value={agingDays}
                onChange={(e) => setAgingDays(parseInt(e.target.value, 10))}
                className="w-full h-10 px-3 border border-line rounded-lg text-sm text-ink font-mono"
              />
              <span className="text-[11px] text-ink-4">Routes older than this window degrade to Outdated</span>
            </div>
          </div>
        </div>

        {/* Section 3: Driver PIN */}
        <div className="space-y-4 pt-4">
          <div className="flex items-center gap-2 pb-2 border-b border-line text-sm font-semibold text-ink">
            <Key className="w-4 h-4 text-accent" />
            <span>Driver Fleet Credentials</span>
          </div>

          <div className="max-w-xs">
            <label className="block text-xs font-semibold text-ink-3 uppercase tracking-wider mb-1">
              Fleet Driver 6-digit Access Code
            </label>
            <input
              type="text"
              maxLength={6}
              value={driverPin}
              onChange={(e) => setDriverPin(e.target.value)}
              className="w-full h-10 px-3 border border-line rounded-lg text-sm text-ink font-mono font-bold tracking-widest text-center"
            />
            <span className="text-[11px] text-ink-4">Drivers use this PIN to start GPS broadcasts</span>
          </div>
        </div>

        <div className="pt-4 border-t border-line flex items-center justify-end">
          <button
            type="submit"
            className="px-5 py-2.5 rounded-lg bg-accent text-white text-xs font-semibold shadow-xs hover:bg-accent/90"
          >
            Save Configuration
          </button>
        </div>
      </form>
    </div>
  );
}
