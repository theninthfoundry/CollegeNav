import * as React from "react";
import { Freshness } from "@/domain/types";
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";
import { StatusTag, StatusTone } from "./status-tag";
import { Info } from "lucide-react";
import { cn } from "../ui/button";

export interface FreshnessTagProps {
  freshness: Freshness;
  interactive?: boolean;
  className?: string;
}

export function FreshnessTag({
  freshness,
  interactive = true,
  className,
}: FreshnessTagProps) {
  const toneMap: Record<Freshness["state"], StatusTone> = {
    verified: "ok",
    aging: "warn",
    outdated: "crit",
    unverified: "muted",
  };

  const tone = toneMap[freshness.state];

  const tag = (
    <StatusTag
      label={freshness.message}
      tone={tone}
      className={cn(interactive && "cursor-pointer hover:opacity-90", className)}
    />
  );

  if (!interactive) return tag;

  return (
    <Popover>
      <PopoverTrigger asChild>{tag}</PopoverTrigger>
      <PopoverContent className="w-80 p-4 space-y-2.5 text-xs text-ink-2 shadow-float border border-line">
        <div className="flex items-center gap-2 border-b border-line pb-2">
          <Info className="w-4 h-4 text-ink-3 shrink-0" />
          <h4 className="font-semibold text-ink text-sm capitalize">
            {freshness.state} Schedule
          </h4>
        </div>
        <p className="leading-relaxed">
          {freshness.state === "verified" &&
            "This schedule was verified by the college transport office within the last 14 days and is actively monitored."}
          {freshness.state === "aging" &&
            "This schedule was verified between 14 and 45 days ago. Minor changes may have occurred."}
          {freshness.state === "outdated" &&
            "This schedule has not been verified for over 45 days or is suspended. Check with the transport office before relying on it."}
          {freshness.state === "unverified" &&
            "This route or schedule has not yet been formally verified by transport coordinators."}
        </p>
        <div className="pt-2 text-ink-3 border-t border-line space-y-1">
          {freshness.verified_at && (
            <div>Verified date: {new Date(freshness.verified_at).toLocaleDateString()}</div>
          )}
          {freshness.valid_to && <div>Valid until: {freshness.valid_to}</div>}
        </div>
      </PopoverContent>
    </Popover>
  );
}
