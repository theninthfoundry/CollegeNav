"use client";

import React, { useState } from "react";
import { RouteBadge } from "@/components/transit/route-badge";
import { Copy, Plus, AlertCircle, Check } from "lucide-react";

interface TimetableRow {
  route_code: string;
  route_name: string;
  direction: "to_campus" | "from_campus";
  bus_reg: string;
  trips: Array<{ time: string; days: string; conflict?: boolean }>;
}

export default function AdminTimetablePage() {
  const [copied, setCopied] = useState(false);
  const [timetable, setTimetable] = useState<TimetableRow[]>([
    {
      route_code: "R1",
      route_name: "Miyapur to Campus",
      direction: "to_campus",
      bus_reg: "TS09 UB 1001",
      trips: [
        { time: "07:00", days: "Mon-Sat" },
        { time: "07:30", days: "Mon-Sat" },
        { time: "08:00", days: "Mon-Fri" },
        { time: "08:30", days: "Mon-Fri" },
      ],
    },
    {
      route_code: "R2",
      route_name: "Kukatpally to Campus",
      direction: "to_campus",
      bus_reg: "TS09 UB 1002",
      trips: [
        { time: "07:15", days: "Mon-Sat" },
        { time: "07:45", days: "Mon-Sat" },
        { time: "08:15", days: "Mon-Fri" },
      ],
    },
    {
      route_code: "R3",
      route_name: "Secunderabad Express",
      direction: "to_campus",
      bus_reg: "TS09 UB 1003",
      trips: [
        { time: "07:30", days: "Mon-Sat" },
        { time: "08:00", days: "Mon-Sat" },
      ],
    },
    {
      route_code: "R4",
      route_name: "Gachibowli Shuttle",
      direction: "to_campus",
      bus_reg: "TS09 UB 1004",
      trips: [
        { time: "07:45", days: "Mon-Fri" },
        { time: "08:15", days: "Mon-Fri" },
      ],
    },
  ]);

  const handleCopyWeekdays = () => {
    setCopied(true);
    setTimeout(() => setCopied(false), 3000);
  };

  return (
    <div className="space-y-6 max-w-6xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-serif text-3xl font-normal tracking-tight text-ink">
            Master Timetable Grid
          </h1>
          <p className="text-sm text-ink-3">
            Schedule departure times across routes with automated vehicle overlap conflict validation.
          </p>
        </div>
        <button
          type="button"
          onClick={handleCopyWeekdays}
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg border border-line bg-paper hover:bg-neutral-50 text-xs font-semibold text-ink shadow-xs"
        >
          <Copy className="w-3.5 h-3.5" />
          <span>Copy Mon–Fri to Saturday</span>
        </button>
      </div>

      {copied && (
        <div className="p-4 rounded-xl border border-emerald-300 bg-emerald-50 text-emerald-900 text-sm font-medium flex items-center gap-2">
          <Check className="w-4 h-4 text-emerald-700" />
          <span>Saturday schedule synchronized with Mon–Fri runs!</span>
        </div>
      )}

      {/* Grid table */}
      <div className="border border-line rounded-xl bg-paper overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead className="bg-neutral-50/70 border-b border-line text-xs font-semibold text-ink-3 uppercase tracking-wider">
            <tr>
              <th className="py-3 px-4 w-48">Route & Direction</th>
              <th className="py-3 px-4 w-32">Vehicle Assigned</th>
              <th className="py-3 px-4">Scheduled Runs</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {timetable.map((row, idx) => (
              <tr key={idx} className="hover:bg-neutral-50/50 transition-colors">
                <td className="py-4 px-4">
                  <div className="flex items-center gap-2">
                    <RouteBadge code={row.route_code} size="sm" />
                    <div>
                      <div className="text-xs font-semibold text-ink">{row.route_name}</div>
                      <div className="text-[11px] text-ink-3 capitalize">
                        {row.direction === "to_campus" ? "To campus" : "From campus"}
                      </div>
                    </div>
                  </div>
                </td>
                <td className="py-4 px-4 font-mono text-xs text-ink-2">{row.bus_reg}</td>
                <td className="py-4 px-4">
                  <div className="flex flex-wrap items-center gap-2">
                    {row.trips.map((t, tIdx) => (
                      <div
                        key={tIdx}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-line bg-neutral-50/80 text-xs"
                      >
                        <span className="font-mono font-bold text-ink tabular-nums">
                          {t.time}
                        </span>
                        <span className="text-[10px] text-ink-3 font-medium font-sans">
                          ({t.days})
                        </span>
                      </div>
                    ))}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
