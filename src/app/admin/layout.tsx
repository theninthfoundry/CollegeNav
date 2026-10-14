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
} from "lucide-react";

const NAV_ITEMS = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/operations", label: "Operations (Today)", icon: Activity },
  { href: "/admin/routes", label: "Routes", icon: Route },
  { href: "/admin/stops", label: "Stops", icon: MapPin },
  { href: "/admin/timetable", label: "Timetable", icon: Calendar },
  { href: "/admin/notices", label: "Notices", icon: Bell },
  { href: "/admin/audit", label: "Audit Log", icon: FileText },
  { href: "/admin/settings", label: "Settings", icon: Settings },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [adminUser] = useState({
    name: "Mr. Rao",
    role: "Transport Coordinator",
  });

  return (
    <div className="min-h-screen flex bg-neutral-50 text-ink antialiased">
      {/* Left Sidebar (240px per spec) */}
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
                  className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    isActive
                      ? "bg-accent text-white shadow-xs"
                      : "text-ink-2 hover:bg-neutral-100 hover:text-ink"
                  }`}
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  <span>{item.label}</span>
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
        <header className="h-16 px-6 bg-paper border-b border-line flex items-center justify-between sticky top-0 z-20">
          <div className="flex items-center gap-4">
            <div className="md:hidden">
              <Link href="/admin" className="font-serif text-xl">
                CollegeNav Admin
              </Link>
            </div>
            <div className="text-xs text-ink-3 hidden sm:block">
              Campus Transport Operations &bull; Asia/Kolkata
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="px-2.5 py-1 rounded bg-accent-tint text-accent text-xs font-medium flex items-center gap-1.5 border border-accent/20">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Super Admin Mode</span>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-6 overflow-y-auto">{children}</main>
      </div>
    </div>
  );
}
