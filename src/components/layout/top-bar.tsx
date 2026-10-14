"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Bell } from "lucide-react";
import { cn } from "../ui/button";

export function TopBar() {
  const pathname = usePathname();

  const links = [
    { label: "Plan", href: "/", active: pathname === "/" || pathname.startsWith("/plan") },
    { label: "Map", href: "/map", active: pathname.startsWith("/map") },
    { label: "Notices", href: "/notices", active: pathname.startsWith("/notices") },
    { label: "Account", href: "/account", active: pathname.startsWith("/account") },
  ];

  return (
    <header className="sticky top-0 z-30 w-full h-14 bg-paper/95 backdrop-blur-xs border-b border-line flex items-center justify-between px-4 sm:px-6 select-none">
      <div className="flex items-center gap-6">
        <Link
          href="/"
          className="font-serif text-2xl font-normal tracking-tight text-ink hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent rounded-sm"
        >
          CollegeNav
        </Link>

        {/* Desktop nav tabs */}
        <nav className="hidden md:flex items-center gap-1 pl-4 border-l border-line">
          {links.map((link) => (
            <Link
              key={link.label}
              href={link.href}
              className={cn(
                "px-3 py-1.5 text-sm font-medium rounded-md transition-colors duration-120 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent",
                link.active
                  ? "bg-s2 text-ink font-semibold"
                  : "text-ink-3 hover:text-ink hover:bg-s1"
              )}
            >
              {link.label}
            </Link>
          ))}
        </nav>
      </div>

      <div className="flex items-center gap-3">
        <Link
          href="/notices"
          aria-label="View service notices"
          className="relative p-2 rounded-md text-ink-2 hover:text-ink hover:bg-s1 transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent cursor-pointer"
        >
          <Bell className="w-5 h-5" strokeWidth={1.5} />
          {/* Active notice badge indicator */}
          <span
            className="absolute top-2.5 right-2.5 w-2 h-2 rounded-full bg-warn"
            aria-hidden="true"
          />
        </Link>
        <Link
          href="/admin"
          className="hidden sm:inline-flex text-xs font-semibold px-2.5 py-1 rounded-sm border border-line-strong hover:bg-s1 text-ink"
        >
          Admin
        </Link>
      </div>
    </header>
  );
}
