"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Activity,
  Route,
  MapPin,
  Bus,
  Calendar,
  Bell,
  FileText,
  Settings,
  ShieldCheck,
  LogOut,
  ExternalLink,
  Menu,
  X,
  Phone,
} from "lucide-react";

const NAV_ITEMS = [
  { href: "/admin", label: "Dashboard", badge: "Live", icon: LayoutDashboard },
  { href: "/admin/operations", label: "Operations", badge: "54", icon: Activity },
  { href: "/admin/routes", label: "Routes", badge: "54", icon: Route },
  { href: "/admin/stops", label: "Stops", badge: "180+", icon: MapPin },
  { href: "/admin/timetable", label: "Timetable", icon: Calendar },
  { href: "/admin/notices", label: "Notices", icon: Bell },
  { href: "/admin/audit", label: "Audit Log", icon: FileText },
  { href: "/admin/settings", label: "Settings", icon: Settings },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [adminUser] = useState({
    name: "Mr. Rao",
    role: "Transport Coordinator",
  });

  return (
    <div className="min-h-screen flex bg-neutral-50 text-ink antialiased">
      {/* Mobile Navigation Drawer Modal */}
      {mobileMenuOpen && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 md:hidden flex"
        >
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-neutral-950/50 backdrop-blur-xs transition-opacity"
            onClick={() => setMobileMenuOpen(false)}
          />

          {/* Drawer content */}
          <aside className="relative w-72 max-w-[85vw] bg-paper h-full flex flex-col justify-between border-r border-line shadow-2xl z-10 animate-in slide-in-from-left duration-200">
            <div>
              {/* Drawer header */}
              <div className="h-16 px-5 flex items-center justify-between border-b border-line">
                <div className="flex items-center gap-2">
                  <span className="font-serif text-2xl tracking-tight text-ink font-normal">
                    CollegeNav
                  </span>
                  <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-accent/10 text-accent font-mono uppercase">
                    Admin
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setMobileMenuOpen(false)}
                  className="w-10 h-10 flex items-center justify-center rounded-lg border border-line hover:bg-neutral-100 text-ink-2"
                  aria-label="Close navigation menu"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Drawer nav items */}
              <nav className="p-3 space-y-1">
                {NAV_ITEMS.map((item) => {
                  const Icon = item.icon;
                  const isActive =
                    item.href === "/admin"
                      ? pathname === "/admin"
                      : pathname.startsWith(item.href);

                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setMobileMenuOpen(false)}
                      className={`flex items-center justify-between px-3.5 py-2.5 rounded-lg text-sm font-medium transition-colors min-h-[44px] ${
                        isActive
                          ? "bg-accent text-white shadow-xs"
                          : "text-ink-2 hover:bg-neutral-100 hover:text-ink"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <Icon className="w-4 h-4 shrink-0" />
                        <span>{item.label}</span>
                      </div>
                      {item.badge && (
                        <span
                          className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded ${
                            isActive
                              ? "bg-white/20 text-white"
                              : "bg-neutral-100 text-ink-3"
                          }`}
                        >
                          {item.badge}
                        </span>
                      )}
                    </Link>
                  );
                })}
              </nav>
            </div>

            {/* Drawer bottom info */}
            <div className="p-4 border-t border-line space-y-3 bg-neutral-50/50">
              <div className="flex items-center justify-between">
                <div className="min-w-0">
                  <div className="text-sm font-semibold text-ink truncate">{adminUser.name}</div>
                  <div className="text-xs text-ink-3 truncate">{adminUser.role}</div>
                </div>
                <div className="w-8 h-8 rounded-full bg-accent text-white flex items-center justify-center font-bold text-xs">
                  R
                </div>
              </div>

              <div className="pt-2 border-t border-line flex items-center justify-between text-xs text-ink-2">
                <Link
                  href="/"
                  target="_blank"
                  className="flex items-center gap-1.5 p-2 rounded hover:bg-neutral-100 transition-colors"
                >
                  <span>Student App</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </Link>
                <Link
                  href="/driver"
                  target="_blank"
                  className="flex items-center gap-1.5 p-2 rounded hover:bg-neutral-100 transition-colors"
                >
                  <span>Driver Mode</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          </aside>
        </div>
      )}

      {/* Desktop Left Sidebar (240px per spec) */}
      <aside className="w-60 min-w-[240px] bg-paper border-r border-line flex flex-col justify-between hidden md:flex">
        <div>
          {/* Brand header */}
          <div className="h-16 px-6 flex items-center justify-between border-b border-line">
            <Link href="/admin" className="flex items-center gap-2">
              <span className="font-serif text-2xl tracking-tight text-ink font-normal">
                CollegeNav
              </span>
              <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-accent/10 text-accent font-mono uppercase">
                Admin
              </span>
            </Link>
          </div>

          {/* Nav links */}
          <nav className="p-3 space-y-1">
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              const isActive =
                item.href === "/admin"
                  ? pathname === "/admin"
                  : pathname.startsWith(item.href);

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center justify-between px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    isActive
                      ? "bg-accent text-white shadow-xs"
                      : "text-ink-2 hover:bg-neutral-100 hover:text-ink"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon className="w-4 h-4 shrink-0" />
                    <span>{item.label}</span>
                  </div>
                  {item.badge && (
                    <span
                      className={`text-[10px] font-mono font-semibold px-1.5 py-0.5 rounded ${
                        isActive
                          ? "bg-white/20 text-white"
                          : "bg-neutral-100 text-ink-3"
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Bottom Profile & Switchers */}
        <div className="p-4 border-t border-line space-y-3">
          <div className="flex items-center justify-between">
            <div className="min-w-0">
              <div className="text-sm font-semibold text-ink truncate">{adminUser.name}</div>
              <div className="text-xs text-ink-3 truncate">{adminUser.role}</div>
            </div>
            <div className="w-8 h-8 rounded-full bg-accent text-white flex items-center justify-center font-bold text-xs">
              R
            </div>
          </div>

          <div className="pt-2 border-t border-line flex items-center justify-between text-xs text-ink-3">
            <Link
              href="/"
              target="_blank"
              className="flex items-center gap-1 hover:text-accent transition-colors"
            >
              <span>Student App</span>
              <ExternalLink className="w-3 h-3" />
            </Link>
            <Link
              href="/driver"
              target="_blank"
              className="flex items-center gap-1 hover:text-accent transition-colors"
            >
              <span>Driver Mode</span>
              <ExternalLink className="w-3 h-3" />
            </Link>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Header */}
        <header className="h-16 px-4 md:px-6 bg-paper border-b border-line flex items-center justify-between sticky top-0 z-20">
          <div className="flex items-center gap-3">
            {/* Mobile menu hamburger button */}
            <button
              type="button"
              onClick={() => setMobileMenuOpen(true)}
              className="md:hidden w-10 h-10 flex items-center justify-center rounded-lg border border-line hover:bg-neutral-100 text-ink"
              aria-label="Open navigation menu"
            >
              <Menu className="w-5 h-5" />
            </button>

            <Link href="/admin" className="md:hidden flex items-center gap-1.5">
              <span className="font-serif text-xl tracking-tight text-ink font-normal">
                CollegeNav
              </span>
              <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-accent/10 text-accent font-mono uppercase">
                Admin
              </span>
            </Link>

            <div className="text-xs text-ink-3 hidden sm:block">
              Campus Transport Operations &bull; 54 Fleet Routes Active &bull; Asia/Kolkata
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            <Link
              href="/driver"
              target="_blank"
              className="hidden sm:inline-flex items-center gap-1 px-2.5 py-1 rounded border border-line bg-neutral-50 hover:bg-neutral-100 text-xs font-semibold text-ink-2 transition-colors"
            >
              <Bus className="w-3.5 h-3.5 text-accent" />
              <span>Driver Mode</span>
            </Link>

            <div className="px-2.5 py-1 rounded bg-accent-tint text-accent text-xs font-medium flex items-center gap-1.5 border border-accent/20">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span className="hidden xs:inline">Transport Admin</span>
            </div>
          </div>
        </header>

        {/* Mobile quick-scroll tab navigation bar */}
        <div className="md:hidden bg-paper border-b border-line px-3 py-2 overflow-x-auto scrollbar-none flex items-center gap-1.5 sticky top-16 z-10">
          {NAV_ITEMS.map((item) => {
            const isActive =
              item.href === "/admin"
                ? pathname === "/admin"
                : pathname.startsWith(item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`whitespace-nowrap px-3 py-1.5 rounded-full text-xs font-semibold shrink-0 transition-colors ${
                  isActive
                    ? "bg-accent text-white shadow-xs"
                    : "bg-neutral-100 text-ink-2 hover:bg-neutral-200"
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </div>

        {/* Page Content */}
        <main className="flex-1 p-3.5 sm:p-6 overflow-y-auto">{children}</main>
      </div>
    </div>
  );
}
