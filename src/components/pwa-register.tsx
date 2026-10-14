"use client";

import { useEffect } from "react";

export function PwaRegister() {
  useEffect(() => {
    if ("serviceWorker" in navigator && process.env.NODE_ENV === "production") {
      navigator.serviceWorker
        .register("/sw.js")
        .then((reg) => {
          // Service worker registered
        })
        .catch((err) => {
          console.debug("SW registration ignored in dev:", err);
        });
    }
  }, []);

  return null;
}
