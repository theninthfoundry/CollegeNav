import * as React from "react";
import { Source } from "@/domain/types";
import { cn } from "../ui/button";

export interface SourceLabelProps {
  source: Source;
  className?: string;
}

export function SourceLabel({ source, className }: SourceLabelProps) {
  const isLive = source === "live";

  const labels: Record<Source, string> = {
    live: "Live",
    estimated: "Estimated",
    scheduled: "Scheduled",
    unavailable: "Unavailable",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 text-xs font-normal select-none",
        isLive ? "text-accent font-medium" : "text-ink-3",
        className
      )}
    >
      {isLive && (
        <span
          className="w-1.5 h-1.5 rounded-[1px] bg-accent animate-[pulse_2s_cubic-bezier(0.4,0,0.6,1)_infinite] motion-reduce:animate-none shrink-0"
          aria-hidden="true"
        />
      )}
      <span>{labels[source]}</span>
    </span>
  );
}
