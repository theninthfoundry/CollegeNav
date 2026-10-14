"use client";

import * as React from "react";
import { cn } from "./button";

export interface ToastItem {
  id: string;
  message: string;
  actionText?: string;
  onAction?: () => void;
  duration?: number;
}

interface ToastContextType {
  toast: (options: Omit<ToastItem, "id">) => void;
}

const ToastContext = React.createContext<ToastContextType | undefined>(undefined);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = React.useState<ToastItem[]>([]);

  const toast = React.useCallback(
    ({ message, actionText, onAction, duration = 4000 }: Omit<ToastItem, "id">) => {
      const id = Math.random().toString(36).substring(2, 9);
      const newToast: ToastItem = { id, message, actionText, onAction, duration };

      setToasts((prev) => [...prev, newToast]);

      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, duration);
    },
    []
  );

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      <div
        aria-live="polite"
        className="fixed bottom-4 left-4 right-4 sm:left-6 sm:right-auto z-50 flex flex-col gap-2 pointer-events-none max-w-sm"
      >
        {toasts.map((t) => (
          <div
            key={t.id}
            role="status"
            className="pointer-events-auto flex items-center justify-between gap-3 bg-ink text-paper px-4 py-3 rounded-md shadow-float text-sm border border-line-strong/20 animate-in fade-in slide-in-from-bottom-2 duration-120"
          >
            <span className="flex-1 font-medium">{t.message}</span>
            {t.actionText && (
              <button
                type="button"
                onClick={() => {
                  t.onAction?.();
                  setToasts((prev) => prev.filter((item) => item.id !== t.id));
                }}
                className="text-paper underline font-semibold hover:text-paper/80 cursor-pointer min-h-[32px] px-1 text-xs"
              >
                {t.actionText}
              </button>
            )}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = React.useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return context;
}
