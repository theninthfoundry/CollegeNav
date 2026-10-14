"use client";

import React, { useState, useEffect } from "react";
import { ChevronDown, ChevronRight, FileText, RefreshCw, ShieldCheck, Filter } from "lucide-react";

export default function AdminAuditLogPage() {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [entityFilter, setEntityFilter] = useState("all");

  const loadAudit = () => {
    setLoading(true);
    fetch("/api/v1/admin/audit")
      .then((res) => res.json())
      .then((data) => {
        setLogs(data.items || []);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });
  };

  useEffect(() => {
    loadAudit();
  }, []);

  const toggleExpand = (id: number) => {
    setExpandedId(expandedId === id ? null : id);
  };

  const filteredLogs = logs.filter((log) => {
    if (entityFilter === "all") return true;
    return log.entity === entityFilter;
  });

  return (
    <div className="space-y-6 max-w-6xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-serif text-3xl font-normal tracking-tight text-ink">
            Audit Trail
          </h1>
          <p className="text-sm text-ink-3">
            Immutable, transactional log of all administrative actions and fleet changes.
          </p>
        </div>
        <button
          type="button"
          onClick={loadAudit}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-line bg-paper hover:bg-neutral-50 text-xs font-semibold text-ink"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Refresh</span>
        </button>
      </div>

      {/* Filter Row */}
      <div className="flex items-center gap-2">
        <Filter className="w-4 h-4 text-ink-3" />
        <span className="text-xs text-ink-3 font-medium">Filter Entity:</span>
        {["all", "route", "trip_instance", "notice", "stop"].map((f) => (
          <button
            key={f}
            type="button"
            onClick={() => setEntityFilter(f)}
            className={`px-3 py-1 rounded-md text-xs font-semibold capitalize transition-colors ${
              entityFilter === f
                ? "bg-ink text-paper"
                : "bg-paper border border-line text-ink-2 hover:bg-neutral-100"
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      {/* Audit Log Table */}
      <div className="border border-line rounded-xl bg-paper overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead className="bg-neutral-50/70 border-b border-line text-xs font-semibold text-ink-3 uppercase tracking-wider">
            <tr>
              <th className="py-3 px-4 w-10"></th>
              <th className="py-3 px-4">Timestamp (IST)</th>
              <th className="py-3 px-4">Actor</th>
              <th className="py-3 px-4">Action</th>
              <th className="py-3 px-4">Entity</th>
              <th className="py-3 px-4">Summary</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {filteredLogs.map((log) => {
              const isExpanded = expandedId === log.id;
              const dateStr = new Date(log.at).toLocaleString("en-IN", {
                timeZone: "Asia/Kolkata",
                month: "short",
                day: "numeric",
                hour: "2-digit",
                minute: "2-digit",
                second: "2-digit",
              });

              return (
                <React.Fragment key={log.id}>
                  <tr
                    onClick={() => toggleExpand(log.id)}
                    className="hover:bg-neutral-50/70 transition-colors cursor-pointer select-none"
                  >
                    <td className="py-3.5 px-4 text-ink-3">
                      {isExpanded ? (
                        <ChevronDown className="w-4 h-4" />
                      ) : (
                        <ChevronRight className="w-4 h-4" />
                      )}
                    </td>
                    <td className="py-3.5 px-4 font-mono text-xs tabular-nums text-ink">
                      {dateStr}
                    </td>
                    <td className="py-3.5 px-4 text-xs font-medium text-ink">
                      Mr. Rao (Coordinator)
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="px-2 py-0.5 rounded text-[11px] font-mono font-semibold uppercase bg-neutral-100 text-ink">
                        {log.action}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-xs font-mono text-accent">
                      {log.entity}
                    </td>
                    <td className="py-3.5 px-4 text-xs text-ink-2 font-medium">
                      {log.summary}
                    </td>
                  </tr>

                  {/* Expanded Before/After JSON Block */}
                  {isExpanded && (
                    <tr className="bg-neutral-50/80">
                      <td colSpan={6} className="p-4 pl-12 border-b border-line">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <div className="text-[11px] font-mono text-ink-3 uppercase font-semibold mb-1">
                              State Before Mutation
                            </div>
                            <pre className="p-3 bg-neutral-900 text-neutral-100 rounded-lg text-xs font-mono overflow-x-auto">
                              {JSON.stringify(log.before || { state: "initial_creation" }, null, 2)}
                            </pre>
                          </div>
                          <div>
                            <div className="text-[11px] font-mono text-ink-3 uppercase font-semibold mb-1">
                              State After Mutation
                            </div>
                            <pre className="p-3 bg-neutral-900 text-neutral-100 rounded-lg text-xs font-mono overflow-x-auto">
                              {JSON.stringify(log.after || {}, null, 2)}
                            </pre>
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
