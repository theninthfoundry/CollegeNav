"use client";

import * as React from "react";
import { ChevronUp, ChevronDown } from "lucide-react";
import { cn } from "./button";

export type SheetSnap = "peek" | "half" | "full";

export interface SheetProps {
  snap?: SheetSnap;
  onSnapChange?: (snap: SheetSnap) => void;
  children: React.ReactNode;
  title?: string;
  className?: string;
}

export function Sheet({
  snap = "half",
  onSnapChange,
  children,
  title,
  className,
}: SheetProps) {
  const [currentSnap, setCurrentSnap] = React.useState<SheetSnap>(snap);

  React.useEffect(() => {
    setCurrentSnap(snap);
  }, [snap]);

  const setSnap = (newSnap: SheetSnap) => {
    setCurrentSnap(newSnap);
    onSnapChange?.(newSnap);
  };

  const cycleSnap = () => {
    if (currentSnap === "peek") setSnap("half");
    else if (currentSnap === "half") setSnap("full");
    else setSnap("peek");
  };

  const snapHeights = {
    peek: "h-[112px]",
    half: "h-[50vh]",
    full: "h-[92vh]",
  }[currentSnap];

  return (
    <div
      className={cn(
        "fixed bottom-0 left-0 right-0 z-40 bg-paper rounded-t-sheet border-t border-line shadow-float transition-all duration-280 ease-[cubic-bezier(0.2,0.7,0.2,1)] flex flex-col md:static md:w-[420px] md:h-full md:rounded-none md:border-t-0 md:border-r md:shadow-none",
        snapHeights,
        className
      )}
      role="region"
      aria-label={title || "Panel sheet"}
    >
      {/* Mobile grabber & snap toggle */}
      <div className="md:hidden flex flex-col items-center pt-2.5 pb-1 px-4 cursor-pointer select-none">
        <button
          type="button"
          onClick={cycleSnap}
          aria-label={`Toggle sheet height, currently ${currentSnap}`}
          className="flex flex-col items-center gap-1.5 p-1 w-full min-h-[32px] justify-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent rounded-sm"
        >
          <div className="w-9 h-1 rounded-full bg-line-strong" />
          <span className="sr-only">Toggle view height</span>
        </button>
      </div>

      {/* Accessible desktop/mobile keyboard alternative */}
      <div className="hidden sr-only focus-within:not-sr-only p-2 bg-s1 border-b border-line">
        <button
          type="button"
          onClick={() => setSnap(currentSnap === "full" ? "half" : "full")}
          className="text-xs text-accent underline p-1 font-medium"
        >
          {currentSnap === "full" ? "Collapse panel" : "Expand panel"}
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-4 pb-6 pt-1 md:p-6">
        {children}
      </div>
    </div>
  );
}
