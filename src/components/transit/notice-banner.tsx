import * as React from "react";
import { RouteBadge } from "./route-badge";
import { RouteRef } from "@/domain/types";
import { cn } from "../ui/button";

export interface NoticeBannerProps {
  id: string;
  type?: string;
  severity: "info" | "warning" | "critical";
  title: string;
  message: string;
  timestamp?: string;
  routes?: RouteRef[];
  onExpand?: () => void;
  className?: string;
}

export function NoticeBanner({
  severity,
  title,
  message,
  timestamp,
  routes = [],
  onExpand,
  className,
}: NoticeBannerProps) {
  const [expanded, setExpanded] = React.useState(false);

  const severityStyles = {
    info: "bg-muted-tint border-muted/30 text-ink",
    warning: "bg-warn-tint border-warn/30 text-ink",
    critical: "bg-crit-tint border-crit/30 text-ink",
  }[severity];

  const leftBarStyles = {
    info: "bg-muted",
    warning: "bg-warn",
    critical: "bg-crit",
  }[severity];

  const severityLabels = {
    info: "Information",
    warning: "Delay",
    critical: "Disruption",
  }[severity];

  return (
    <div
      role="alert"
      className={cn(
        "relative w-full rounded-md border p-3 pl-4 transition-all duration-120 overflow-hidden select-none",
        severityStyles,
        className
      )}
    >
      {/* Left 3px solid indicator bar */}
      <div
        className={cn("absolute left-0 top-0 bottom-0 w-[3px]", leftBarStyles)}
        aria-hidden="true"
      />

      <div className="flex flex-col gap-1">
        <div className="flex items-center justify-between gap-2">
          <span className="text-xs font-semibold uppercase tracking-wider text-ink-3">
            {severityLabels}
          </span>
          {timestamp && <span className="text-xs text-ink-3">{timestamp}</span>}
        </div>

        <h4 className="text-sm font-semibold text-ink leading-snug">{title}</h4>

        <p
          className={cn(
            "text-sm text-ink-2 leading-relaxed",
            !expanded && "line-clamp-2"
          )}
        >
          {message}
        </p>

        {message.length > 120 && (
          <button
            type="button"
            onClick={() => setExpanded(!expanded)}
            className="text-xs font-medium text-accent underline self-start pt-0.5 cursor-pointer min-h-[32px] flex items-center"
          >
            {expanded ? "Show less" : "Read more"}
          </button>
        )}

        {routes.length > 0 && (
          <div className="flex items-center gap-1.5 pt-1.5 mt-0.5 border-t border-line/40">
            <span className="text-xs text-ink-3">Affects:</span>
            {routes.map((r) => (
              <RouteBadge key={r.id} code={r.code} colorIndex={r.color_index} size="sm" />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
