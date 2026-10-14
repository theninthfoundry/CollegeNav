import * as React from "react";
import { cn } from "../ui/button";

export interface TimelineStopItem {
  stopId: string;
  name: string;
  timeStr: string;
  secondaryText?: string;
  isBoarding?: boolean;
  isAlighting?: boolean;
  isPassed?: boolean;
  isCurrent?: boolean;
}

export interface StopTimelineProps {
  colorIndex: number;
  stops: TimelineStopItem[];
  className?: string;
}

export function StopTimeline({
  colorIndex,
  stops,
  className,
}: StopTimelineProps) {
  const colorVar = `var(--route-${Math.min(Math.max(1, colorIndex || 1), 8)})`;

  return (
    <div className={cn("relative py-2 select-none", className)}>
      {stops.map((s, index) => {
        const isFirst = index === 0;
        const isLast = index === stops.length - 1;
        const isHighlight = s.isBoarding || s.isAlighting;

        return (
          <div key={s.stopId} className="flex items-start gap-4 min-h-[56px] relative">
            {/* Connecting line */}
            {!isLast && (
              <div
                style={{ backgroundColor: colorVar }}
                className="absolute left-[88px] top-4 bottom-0 w-0.5"
                aria-hidden="true"
              />
            )}

            {/* Left: Time (tabular) */}
            <div className="w-16 shrink-0 text-right pt-0.5">
              <span
                className={cn(
                  "tabular-nums text-sm font-medium",
                  s.isPassed ? "text-ink-4" : isHighlight ? "text-ink font-semibold" : "text-ink-2"
                )}
              >
                {s.timeStr}
              </span>
            </div>

            {/* Middle: Node dot */}
            <div className="relative z-10 flex items-center justify-center w-6 h-6 shrink-0 pt-0.5">
              {isHighlight ? (
                <div
                  style={{ backgroundColor: colorVar }}
                  className="w-3.5 h-3.5 rounded-full ring-4 ring-paper"
                />
              ) : (
                <div
                  style={{ borderColor: colorVar }}
                  className={cn(
                    "w-2.5 h-2.5 rounded-full bg-paper border-2 ring-4 ring-paper",
                    s.isPassed && "border-ink-4"
                  )}
                />
              )}
            </div>

            {/* Right: Stop name & secondary text */}
            <div className="flex-1 pb-4 pt-0.5">
              <div className="flex items-center gap-2">
                <span
                  className={cn(
                    "text-sm font-medium",
                    s.isPassed ? "text-ink-4" : isHighlight ? "text-ink font-semibold" : "text-ink"
                  )}
                >
                  {s.name}
                </span>
                {s.isBoarding && (
                  <span className="text-[11px] font-semibold bg-accent-tint text-accent px-1.5 py-0.5 rounded-[4px] border border-accent-line">
                    Board
                  </span>
                )}
                {s.isAlighting && (
                  <span className="text-[11px] font-semibold bg-accent-tint text-accent px-1.5 py-0.5 rounded-[4px] border border-accent-line">
                    Alight
                  </span>
                )}
              </div>
              {s.secondaryText && (
                <p className="text-xs text-ink-3 mt-0.5">{s.secondaryText}</p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
