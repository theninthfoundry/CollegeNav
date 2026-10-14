import * as React from "react";
import { JourneyOption } from "@/domain/types";
import { RouteBadge } from "./route-badge";
import { SourceLabel } from "./source-label";
import { StatusTag } from "./status-tag";
import { formatKolkataTime } from "@/domain/time";
import { cn } from "../ui/button";

export interface JourneyCardProps {
  option: JourneyOption;
  isSelected?: boolean;
  onSelect?: () => void;
  className?: string;
}

export function JourneyCard({
  option,
  isSelected = false,
  onSelect,
  className,
}: JourneyCardProps) {
  const boardTime = formatKolkataTime(new Date(option.board.time.at));
  const alightTime = formatKolkataTime(new Date(option.alight.time.at));
  const isOutdated = option.freshness.state === "outdated";

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onSelect}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onSelect?.();
        }
      }}
      aria-pressed={isSelected}
      className={cn(
        "flex flex-col gap-3.5 p-4 rounded-lg border transition-all duration-120 cursor-pointer select-none text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent",
        isSelected
          ? "border-accent-line bg-accent-tint shadow-xs"
          : "border-line bg-paper hover:bg-s1 hover:border-line-strong",
        className
      )}
    >
      {/* Top row: Badge, Boarding info, Best option or Freshness warning */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2.5 min-w-0">
          <RouteBadge
            code={option.route.code}
            colorIndex={option.route.color_index}
            size="lg"
          />
          <div className="min-w-0">
            <p className="text-sm font-medium text-ink truncate">
              Board at {option.board.stop.name}
            </p>
            <SourceLabel source={option.board.time.source} />
          </div>
        </div>

        <div className="shrink-0 flex items-center gap-2">
          {option.best && (
            <span className="text-xs font-semibold text-accent px-2 py-0.5 rounded-sm bg-accent-tint border border-accent-line">
              Best option
            </span>
          )}
          {isOutdated && (
            <StatusTag label="Schedule may be outdated" tone="crit" />
          )}
        </div>
      </div>

      {/* Center: Large tabular numerals, thin line, ride duration */}
      <div className="flex items-center justify-between gap-4 py-1">
        <div className="flex flex-col">
          <span className="tabular-nums text-2xl sm:text-3xl font-medium tracking-tight text-ink">
            {boardTime}
          </span>
          <span className="text-xs text-ink-3">Depart</span>
        </div>

        <div className="flex-1 flex flex-col items-center px-2">
          <span className="text-xs text-ink-3 font-medium mb-1">
            {option.ride_min} min ride
          </span>
          <div className="w-full h-[1px] bg-line-strong relative flex items-center justify-end">
            <span className="w-1.5 h-1.5 rounded-full bg-ink-3" aria-hidden="true" />
          </div>
        </div>

        <div className="flex flex-col text-right">
          <span className="tabular-nums text-2xl sm:text-3xl font-medium tracking-tight text-ink">
            {alightTime}
          </span>
          <span className="text-xs text-ink-3">Arrive</span>
        </div>
      </div>

      {/* Bottom breakdown: Walk, Wait, Ride */}
      <div className="flex items-center justify-between text-xs text-ink-2 pt-2 border-t border-line/60">
        <span>{option.walk_to_board.minutes + option.walk_from_alight.minutes} min walk</span>
        <span>•</span>
        <span>{option.wait_min} min wait</span>
        <span>•</span>
        <span>{option.ride_min} min ride</span>
        <span className="font-semibold text-ink ml-auto">{option.total_min} min total</span>
      </div>
    </div>
  );
}
