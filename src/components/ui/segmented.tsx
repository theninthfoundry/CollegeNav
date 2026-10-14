import * as React from "react";
import { cn } from "./button";

export interface SegmentedOption<T extends string> {
  value: T;
  label: string;
}

export interface SegmentedProps<T extends string> {
  options: SegmentedOption<T>[];
  value: T;
  onChange: (value: T) => void;
  className?: string;
  name?: string;
}

export function Segmented<T extends string>({
  options,
  value,
  onChange,
  className,
  name,
}: SegmentedProps<T>) {
  return (
    <div
      role="radiogroup"
      aria-label={name}
      className={cn(
        "inline-flex p-1 bg-s2 rounded-md border border-line w-full sm:w-auto",
        className
      )}
    >
      {options.map((opt) => {
        const isSelected = opt.value === value;
        return (
          <button
            key={opt.value}
            type="button"
            role="radio"
            aria-checked={isSelected}
            tabIndex={isSelected ? 0 : -1}
            onClick={() => onChange(opt.value)}
            className={cn(
              "flex-1 sm:flex-initial min-h-[38px] px-3.5 py-1.5 text-sm font-medium rounded-sm transition-all duration-120 select-none cursor-pointer text-center",
              isSelected
                ? "bg-paper text-ink border border-line shadow-none font-semibold"
                : "bg-transparent text-ink-3 hover:text-ink hover:bg-s1/60"
            )}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}
