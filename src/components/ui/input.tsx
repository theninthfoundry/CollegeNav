import * as React from "react";
import { cn } from "./button";

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type = "text", label, error, helperText, id, ...props }, ref) => {
    const generatedId = React.useId();
    const inputId = id || generatedId;
    const errorId = error ? `${inputId}-error` : undefined;
    const helperId = helperText ? `${inputId}-helper` : undefined;

    return (
      <div className="w-full flex flex-col gap-1.5">
        {label && (
          <label
            htmlFor={inputId}
            className="text-sm font-medium text-ink select-none"
          >
            {label}
          </label>
        )}
        <input
          id={inputId}
          type={type}
          ref={ref}
          aria-invalid={!!error}
          aria-describedby={errorId || helperId}
          className={cn(
            "h-11 w-full rounded-md border bg-paper px-3 text-sm text-ink transition-colors duration-120 placeholder:text-ink-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-paper disabled:cursor-not-allowed disabled:bg-s2 disabled:text-ink-4",
            error ? "border-crit" : "border-line-strong hover:border-ink-3",
            className
          )}
          {...props}
        />
        {error ? (
          <p id={errorId} className="text-xs text-crit" role="alert">
            {error}
          </p>
        ) : helperText ? (
          <p id={helperId} className="text-xs text-ink-3">
            {helperText}
          </p>
        ) : null}
      </div>
    );
  }
);

Input.displayName = "Input";
