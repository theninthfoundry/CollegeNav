import * as React from "react";
import { cn } from "../ui/button";

export type StatusTone = "ok" | "warn" | "crit" | "muted";

export interface StatusTagProps {
  label: string;
  tone?: StatusTone;
  className?: string;
}

export function StatusTag({
  label,
  tone = "ok",
  className,
}: StatusTagProps) {
  const toneStyles = {
    ok: "bg-ok-tint text-ok border-ok/20",
    warn: "bg-warn-tint text-warn border-warn/20",
    crit: "bg-crit-tint text-crit border-crit/20",
    muted: "bg-muted-tint text-muted border-muted/20",
  }[tone];

  const dotStyles = {
    ok: "bg-ok",
    warn: "bg-warn",
    crit: "bg-crit",
    muted: "bg-muted",
  }[tone];

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 h-6 px-2 text-xs font-medium rounded-sm border select-none",
        toneStyles,
        className
      )}
    >
      <span className={cn("w-1.5 h-1.5 rounded-[1px] shrink-0", dotStyles)} aria-hidden="true" />
      <span>{label}</span>
    </span>
  );
}
