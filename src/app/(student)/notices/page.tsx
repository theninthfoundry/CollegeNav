"use client";

import * as React from "react";
import { Segmented } from "@/components/ui/segmented";
import { NoticeBanner } from "@/components/transit/notice-banner";
import { Skeleton } from "@/components/ui/skeleton";
import { api } from "@/lib/api";

export default function NoticesPage() {
  const [tab, setTab] = React.useState<"active" | "earlier">("active");
  const [notices, setNotices] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    let isMounted = true;
    setLoading(true);

    api.notices
      .list()
      .then((res) => {
        if (!isMounted) return;
        setNotices(res.items || []);
        setLoading(false);
      })
      .catch(() => {
        if (!isMounted) return;
        setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <div className="max-w-2xl mx-auto p-4 sm:p-6 space-y-6">
      <header className="space-y-1">
        <h1 className="font-serif text-3xl font-normal tracking-tight text-ink">
          Notices
        </h1>
        <p className="text-sm text-ink-3">
          Campus transit updates, diversions, weather delays, and notices.
        </p>
      </header>

      {/* Tabs */}
      <div>
        <Segmented
          name="Notice Tab"
          value={tab}
          onChange={(val) => setTab(val as "active" | "earlier")}
          options={[
            { value: "active", label: "Active" },
            { value: "earlier", label: "Earlier" },
          ]}
        />
      </div>

      {loading ? (
        <div className="space-y-4">
          <Skeleton className="h-28 w-full rounded-md" />
          <Skeleton className="h-28 w-full rounded-md" />
        </div>
      ) : tab === "active" ? (
        notices.length > 0 ? (
          <div className="space-y-3">
            {notices.map((n) => (
              <NoticeBanner
                key={n.id}
                id={n.id}
                severity={n.severity}
                title={n.title}
                message={n.body}
                timestamp={new Date(n.starts_at).toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
                routes={n.routes}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-12 px-4 border border-line rounded-lg bg-s1 space-y-2">
            <h3 className="font-serif text-xl font-normal text-ink">Nothing to report</h3>
            <p className="text-sm text-ink-3">Service notices appear here.</p>
          </div>
        )
      ) : (
        <div className="text-center py-12 px-4 border border-line rounded-lg bg-s1 space-y-2">
          <h3 className="font-serif text-xl font-normal text-ink">No earlier notices</h3>
          <p className="text-sm text-ink-3">Archived notices from the past 30 days appear here.</p>
        </div>
      )}
    </div>
  );
}
