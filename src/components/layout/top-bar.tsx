"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Bell, Bus, Shield, ExternalLink } from "lucide-react";
import { cn } from "../ui/button";

export function TopBar() {
  const pathname = usePathname();

  const links = [
    { label: "Plan", href: "/", active: pathname === "/" || pathname.startsWith("/plan") },
    { label: "Network Map", href: "/map", active: pathname.startsWith("/map") },
    { label: "Notices", href: "/notices", active: pathname.startsWith("/notices") },
    { label: "Account", href: "/account", active: pathname.startsWith("/account") },
  ];

  return (
    <header className="sticky top-0 z-30 w-full h-14 bg-paper/95 backdrop-blur-md border-b border-line flex items-center justify-between px-4 sm:px-6 select-none shadow-xs">
      {/* Brand & Student Portal Badge */}
      <div className="flex items-center gap-4 sm:gap-6">
        <div className="flex items-center gap-2.5">
          <Link
            href="/"
            className="font-serif text-2xl font-normal tracking-tight text-ink hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent rounded-sm"
          >
            CollegeNav
          </Link>
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-accent-tint text-accent border border-accent/30 tracking-tight">
            <span className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse" aria-hidden="true" />
            <span>Student Portal</span>
          </span>
        </div>

        {/* Desktop nav tabs */}
        <nav className="hidden md:flex items-center gap-1 pl-4 border-l border-line">
          {links.map((link) => (
            <Link
              key={link.label}
              href={link.href}
              className={cn(
                "px-3 py-1.5 text-xs font-semibold rounded-md transition-colors duration-120 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent",
                link.active
                  ? "bg-ink text-paper"
                  : "text-ink-2 hover:text-ink hover:bg-neutral-100"
              )}
            >
              {link.label}
            </Link>
          ))}
        </nav>
      </div>

      {/* Surface switcher and notices */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Quick surface switchers */}
        <div className="flex items-center gap-1.5 text-xs">
          <Link
            href="/driver"
            target="_blank"
            className="flex items-center gap-1 px-2.5 py-1 rounded-md border border-line text-ink-3 hover:text-ink hover:bg-neutral-50 transition-colors"
            title="Open Driver Cockpit"
          >
            <Bus className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Driver</span>
          </Link>
          <Link
            href="/admin"
            target="_blank"
            className="flex items-center gap-1 px-2.5 py-1 rounded-md border border-line text-ink-3 hover:text-ink hover:bg-neutral-50 transition-colors"
            title="Open Transport Admin Console"
          >
            <Shield className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Admin</span>
          </Link>
        </div>

        {/* Notices Bell */}
        <Link
          href="/notices"
          aria-label="View service notices"
          className="relative p-2 rounded-md text-ink-2 hover:text-ink hover:bg-neutral-100 transition-colors min-h-[40px] min-w-[40px] flex items-center justify-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent cursor-pointer"
        >
          <Bell className="w-4 h-4" strokeWidth={2} />
          {/* Active notice badge indicator */}
          <span
            className="absolute top-2 right-2 w-2 h-2 rounded-full bg-warn ring-2 ring-paper"
            aria-hidden="true"
          />
        </Link>
      </div>
    </header>
  );
}
