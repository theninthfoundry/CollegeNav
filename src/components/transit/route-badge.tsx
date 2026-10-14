import * as React from "react";
import { cn } from "../ui/button";

export interface RouteBadgeProps {
  code: string;
  colorIndex?: number;
  size?: "sm" | "md" | "lg";
  className?: string;
}

export function RouteBadge({
  code,
  colorIndex,
  size = "md",
  className,
}: RouteBadgeProps) {
  // Safe color index clamp 1 to 8; derive from code number if not specified
  const derivedIdx = colorIndex ?? (parseInt(code.replace(/\D/g, ""), 10) || 1);
  const idx = Math.min(Math.max(1, derivedIdx), 8);
  const colorVar = `var(--route-${idx})`;

  const sizeClasses = {
    sm: "w-6 h-6 text-xs",
    md: "w-7 h-7 text-sm", // 28px standard
    lg: "w-8 h-8 text-sm", // 32px on result cards
  }[size];

  return (
    <span
      style={{ backgroundColor: colorVar }}
      aria-label={`Route ${code}`}
      className={cn(
        "inline-flex items-center justify-center font-semibold text-paper rounded-sm shrink-0 select-none tracking-tight",
        sizeClasses,
        className
      )}
    >
      {code}
    </span>
  );
}
