import * as React from "react";
import { cn } from "./button";

export function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      aria-hidden="true"
      className={cn(
        "animate-pulse rounded-md bg-s2 motion-reduce:animate-none",
        className
      )}
      {...props}
    />
  );
}
