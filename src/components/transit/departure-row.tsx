import * as React from "react";
import { RouteRef, Source } from "@/domain/types";
import { RouteBadge } from "./route-badge";
import { SourceLabel } from "./source-label";
import { StatusTag } from "./status-tag";
import { cn } from "../ui/button";

export interface DepartureRowProps {
  route: RouteRef;
  destination: string;
  secondaryText?: string;
  timeStr: string; // e.g. "7:42 am"
  countdownText?: string; // e.g. "in 9 min"
  source: Source;
  statusText?: string; // "On time", "Delayed 8 min", "Cancelled"
  isCancelled?: boolean;
  onClick?: () => void;
  className?: string;
}

export function DepartureRow({
  route,
  destination,
  secondaryText,
  timeStr,
  countdownText,
  source,
  statusText,
  isCancelled = false,
  onClick,
  className,
}: DepartureRowProps) {
  const isClickable = !!onClick;

  return (
    <div
      role={isClickable ? "button" : undefined}
      tabIndex={isClickable ? 0 : undefined}
      onClick={onClick}
      onKeyDown={(e) => {
        if (isClickable && (e.key === "Enter" || e.key === " ")) {
          e.preventDefault();
          onClick();
        }
      }}
      className={cn(
        "flex items-center justify-between gap-3 h-16 px-3 border-b border-line bg-paper transition-colors duration-120 select-none",
        isClickable && "hover:bg-s1 active:bg-s2 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent",
        className
      )}
    >
      {/* Left: Route badge */}
      <div className="shrink-0">
        <RouteBadge code={route.code} colorIndex={route.color_index} size="md" />
      </div>

      {/* Middle: Destination & secondary */}
      <div className="flex-1 min-w-0 pr-2">
        <div className="flex items-center gap-2">
          <span
            className={cn(
              "text-base font-medium truncate",
              isCancelled ? "line-through text-ink-3" : "text-ink"
            )}
          >
            {destination}
          </span>
          {isCancelled && <StatusTag label="Cancelled" tone="crit" />}
          {!isCancelled && statusText && statusText !== "On time" && (
            <StatusTag
              label={statusText}
              tone={statusText.toLowerCase().includes("delayed") ? "warn" : "ok"}
            />
          )}
        </div>
        {secondaryText && (
          <p className="text-xs text-ink-3 truncate mt-0.5">{secondaryText}</p>
        )}
      </div>

      {/* Right: Time, countdown, source label */}
      <div className="text-right shrink-0 flex flex-col items-end">
        <span
          className={cn(
            "tabular-nums text-lg font-medium leading-none tracking-tight",
            isCancelled ? "line-through text-ink-3" : "text-ink"
          )}
        >
          {timeStr}
        </span>
        <div className="flex items-center gap-1.5 mt-1">
          {countdownText && !isCancelled && (
            <span className="text-xs text-ink-3">{countdownText}</span>
          )}
          <SourceLabel source={source} />
        </div>
      </div>
    </div>
  );
}
