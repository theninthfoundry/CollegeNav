import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  asChild?: boolean;
  variant?: "primary" | "secondary" | "ghost" | "accent" | "danger";
  size?: "lg" | "md" | "sm";
  loading?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = "primary",
      size = "md",
      loading = false,
      disabled,
      asChild = false,
      children,
      ...props
    },
    ref
  ) => {
    const Comp = asChild ? Slot : "button";

    const baseStyles =
      "inline-flex items-center justify-center font-medium rounded-md transition-all duration-120 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-paper disabled:pointer-events-none disabled:bg-s2 disabled:text-ink-4 disabled:border-transparent select-none cursor-pointer";

    const variantStyles = {
      primary: "bg-ink text-paper hover:bg-[#1a1a1a]",
      secondary: "bg-paper text-ink border border-line-strong hover:bg-s1",
      ghost: "bg-transparent text-ink hover:bg-s1",
      accent: "bg-accent text-paper hover:bg-accent-hover",
      danger: "bg-crit text-paper hover:bg-[#8e1717]",
    }[variant];

    const sizeStyles = {
      lg: "h-12 px-5 text-sm min-h-[44px]",
      md: "h-10 px-4 text-sm min-h-[44px]",
      sm: "h-8 px-3 text-xs min-h-[32px]",
    }[size];

    return (
      <Comp
        ref={ref}
        disabled={disabled || loading}
        aria-busy={loading}
        className={cn(baseStyles, variantStyles, sizeStyles, className)}
        {...props}
      >
        {loading ? (
          <span className="inline-flex items-center gap-2">
            <svg
              className="animate-spin h-4 w-4 text-current"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="3"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
              />
            </svg>
            <span className="opacity-0 w-0 h-0 overflow-hidden">{children}</span>
          </span>
        ) : (
          children
        )}
      </Comp>
    );
  }
);

Button.displayName = "Button";
