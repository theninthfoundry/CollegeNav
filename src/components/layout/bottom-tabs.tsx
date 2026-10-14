"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Search, Map, Bell, User } from "lucide-react";
import { cn } from "../ui/button";

export function BottomTabs() {
  const pathname = usePathname();

  const tabs = [
    { label: "Plan", href: "/", icon: Search, active: pathname === "/" || pathname.startsWith("/plan") },
    { label: "Map", href: "/map", icon: Map, active: pathname.startsWith("/map") },
    { label: "Notices", href: "/notices", icon: Bell, active: pathname.startsWith("/notices") },
    { label: "Account", href: "/account", icon: User, active: pathname.startsWith("/account") },
  ];

  return (
    <nav
      role="navigation"
      aria-label="Bottom Navigation"
      className="md:hidden fixed bottom-0 left-0 right-0 z-30 h-14 bg-paper border-t border-line flex items-center justify-around pb-safe select-none"
    >
      {tabs.map((t) => {
        const Icon = t.icon;
        return (
          <Link
            key={t.label}
            href={t.href}
            aria-current={t.active ? "page" : undefined}
            className={cn(
              "relative flex flex-col items-center justify-center flex-1 h-full min-h-[44px] transition-colors duration-120 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent",
              t.active ? "text-ink font-semibold" : "text-ink-3 hover:text-ink"
            )}
          >
            {t.active && (
              <span
                className="absolute top-0 left-4 right-4 h-[2px] bg-accent"
                aria-hidden="true"
              />
            )}
            <Icon className="w-5 h-5 shrink-0" strokeWidth={1.5} />
            <span className="text-[11px] leading-tight mt-0.5">{t.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
