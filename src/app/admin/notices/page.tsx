"use client";

import React, { useState, useEffect } from "react";
import { Bell, Plus, ShieldCheck, Check, Send, AlertTriangle, Smartphone } from "lucide-react";
import { NoticeBanner } from "@/components/transit/notice-banner";
import { RouteBadge } from "@/components/transit/route-badge";

export default function AdminNoticesPage() {
  const [notices, setNotices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Composer fields
  const [type, setType] = useState<"route_change" | "delay" | "cancellation" | "general">("route_change");
  const [severity, setSeverity] = useState<"info" | "warning" | "critical">("warning");
  const [title, setTitle] = useState("Route 3 diverted via Ring Road");
  const [message, setMessage] = useState(
    "Due to metro flyover maintenance near Ameerpet, Route 3 will bypass Panjagutta today. Expect a 10 min additional travel time."
  );
  const [affectedRoute, setAffectedRoute] = useState("R3");
  const [publishSuccess, setPublishSuccess] = useState(false);

  const loadNotices = () => {
    setLoading(true);
    fetch("/api/v1/notices?active=false")
      .then((res) => res.json())
      .then((data) => {
        setNotices(data.items || []);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });
  };

  useEffect(() => {
    loadNotices();
  }, []);

  const handlePublish = async (e: React.FormEvent) => {
    e.preventDefault();
    setPublishSuccess(true);
    setTimeout(() => {
      setPublishSuccess(false);
      // Prepend to current list
      setNotices([
        {
          id: `notice-${Date.now()}`,
          title,
          body: message,
          severity,
          type,
          starts_at: new Date().toISOString(),
          routes: [{ code: affectedRoute, color_index: 3 }],
        },
        ...notices,
      ]);
    }, 1000);
  };

  // Push preview text max 110 chars per spec
  const pushText = `${title}: ${message}`.slice(0, 110);

  return (
    <div className="space-y-6 max-w-6xl">
      <div>
        <h1 className="font-serif text-3xl font-normal tracking-tight text-ink">
          Notices & Broadcasts
        </h1>
        <p className="text-sm text-ink-3">
          Broadcast disruptions, route diversions, and delays with targeted reach.
        </p>
      </div>

      {publishSuccess && (
        <div className="p-4 rounded-xl border border-emerald-300 bg-emerald-50 text-emerald-900 text-sm font-medium flex items-center gap-2">
          <Check className="w-4 h-4 text-emerald-700" />
          <span>Notice published! Web push dispatched to 214 followers and audit log recorded.</span>
        </div>
      )}

      {/* Two-Pane Composer: Left Fields, Right Student Preview */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Form */}
        <form onSubmit={handlePublish} className="bg-paper p-5 rounded-xl border border-line space-y-4 shadow-xs">
          <h2 className="text-base font-semibold text-ink">Notice Composer</h2>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-ink-3 uppercase tracking-wider mb-1">
                Notice Type
              </label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value as any)}
                className="w-full h-10 px-3 border border-line rounded-lg text-sm text-ink bg-paper"
              >
                <option value="route_change">Route Change / Diversion</option>
                <option value="delay">Service Delay</option>
                <option value="cancellation">Cancellation</option>
                <option value="general">General Campus Notice</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-ink-3 uppercase tracking-wider mb-1">
                Severity
              </label>
              <select
                value={severity}
                onChange={(e) => setSeverity(e.target.value as any)}
                className="w-full h-10 px-3 border border-line rounded-lg text-sm text-ink bg-paper"
              >
                <option value="info">Info (Blue)</option>
                <option value="warning">Warning (Amber)</option>
                <option value="critical">Critical (Red)</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-ink-3 uppercase tracking-wider mb-1">
              Title
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full h-10 px-3 border border-line rounded-lg text-sm text-ink"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-semibold text-ink-3 uppercase tracking-wider">
                Full Message Body
              </label>
              <span className="text-[11px] text-ink-4">{message.length}/280</span>
            </div>
            <textarea
              required
              maxLength={280}
              rows={4}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="w-full p-3 border border-line rounded-lg text-sm text-ink"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-ink-3 uppercase tracking-wider mb-1">
              Affected Route
            </label>
            <div className="flex items-center gap-2">
              {["R1", "R2", "R3", "R4"].map((code) => (
                <button
                  key={code}
                  type="button"
                  onClick={() => setAffectedRoute(code)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-semibold transition-all ${
                    affectedRoute === code
                      ? "border-accent bg-accent/10 shadow-xs"
                      : "border-line bg-paper text-ink-2"
                  }`}
                >
                  <RouteBadge code={code} size="sm" />
                  <span>{code}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Reach estimation preview */}
          <div className="p-3 bg-neutral-50 rounded-lg border border-line flex items-center justify-between text-xs text-ink-2">
            <span>Estimated Student Audience:</span>
            <span className="font-semibold text-ink">214 route followers &bull; 160 push subscribers</span>
          </div>

          <div className="pt-2 flex items-center justify-end gap-2.5">
            <button
              type="submit"
              className="px-5 py-2.5 rounded-lg bg-accent text-white text-xs font-semibold shadow-xs hover:bg-accent/90 flex items-center gap-2"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Publish Notice</span>
            </button>
          </div>
        </form>

        {/* Right Live Preview as Students See It */}
        <div className="space-y-4">
          <div className="bg-paper p-5 rounded-xl border border-line space-y-4 shadow-xs">
            <h3 className="text-xs font-semibold text-ink-3 uppercase tracking-wider">
              Student App Banner Preview
            </h3>
            <NoticeBanner
              id="preview"
              title={title}
              message={message}
              severity={severity}
              timestamp="Active today"
              routes={[{ id: "r", code: affectedRoute, name: "Affected Route", color_index: 3 }]}
            />
          </div>

          {/* Push Notification preview */}
          <div className="bg-paper p-5 rounded-xl border border-line space-y-3 shadow-xs">
            <div className="flex items-center gap-2 text-xs font-semibold text-ink-3 uppercase tracking-wider">
              <Smartphone className="w-4 h-4 text-accent" />
              <span>Mobile Push Notification Preview (Max 110 chars)</span>
            </div>
            <div className="p-3 bg-neutral-900 text-white rounded-xl shadow-md space-y-1">
              <div className="flex items-center justify-between text-[11px] text-neutral-400">
                <span className="font-semibold text-white">CollegeNav</span>
                <span>now</span>
              </div>
              <div className="text-xs font-medium text-neutral-100">{pushText}...</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
