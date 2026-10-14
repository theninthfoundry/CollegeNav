"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Segmented } from "@/components/ui/segmented";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { ToastProvider, useToast } from "@/components/ui/toast";
import { Skeleton } from "@/components/ui/skeleton";
import { RouteBadge } from "@/components/transit/route-badge";
import { StatusTag } from "@/components/transit/status-tag";
import { SourceLabel } from "@/components/transit/source-label";
import { FreshnessTag } from "@/components/transit/freshness-tag";
import { DepartureRow } from "@/components/transit/departure-row";
import { StopTimeline } from "@/components/transit/stop-timeline";
import { NoticeBanner } from "@/components/transit/notice-banner";
import { JourneyCard } from "@/components/transit/journey-card";
import { JourneyOption } from "@/domain/types";

function ComponentShowcase() {
  const { toast } = useToast();
  const [segmentedTime, setSegmentedTime] = React.useState("now");
  const [segmentedDir, setSegmentedDir] = React.useState("to_campus");
  const [selectedJourney, setSelectedJourney] = React.useState("opt_1");

  const sampleJourney: JourneyOption = {
    id: "opt_1",
    rank: 1,
    best: true,
    route: { id: "r1", code: "R1", name: "Miyapur to Campus", color_index: 1 },
    board: {
      stop: { id: "s1", name: "Kukatpally Housing Board", lat: 17.4948, lng: 78.3996 },
      time: { at: "2026-10-14T07:42:00+05:30", source: "live" },
    },
    alight: {
      stop: { id: "s2", name: "Main Campus", lat: 17.5400, lng: 78.3800 },
      time: { at: "2026-10-14T08:24:00+05:30", source: "live" },
    },
    walk_to_board: { meters: 480, minutes: 6 },
    walk_from_alight: { meters: 0, minutes: 0 },
    wait_min: 9,
    ride_min: 42,
    total_min: 57,
    depart_at: "2026-10-14T07:36:00+05:30",
    arrive_at: "2026-10-14T08:24:00+05:30",
    freshness: {
      state: "verified",
      verified_at: "2026-10-11T00:00:00+05:30",
      days_since: 3,
      valid_to: null,
      message: "Verified 3 days ago",
    },
    warnings: [],
    notices: [],
  };

  const outdatedJourney: JourneyOption = {
    ...sampleJourney,
    id: "opt_2",
    rank: 2,
    best: false,
    route: { id: "r3", code: "R3", name: "Uppal to Campus", color_index: 3 },
    freshness: {
      state: "outdated",
      verified_at: "2026-08-01T00:00:00+05:30",
      days_since: 74,
      valid_to: null,
      message: "Schedule may be outdated",
    },
    warnings: ["Schedule may be outdated"],
  };

  return (
    <div className="max-w-4xl mx-auto p-6 md:p-10 space-y-12 bg-paper text-ink">
      <header className="border-b border-line pb-4">
        <h1 className="font-serif text-3xl font-normal text-ink">
          Design System & Component Gallery
        </h1>
        <p className="text-sm text-ink-3 mt-1">
          Reviewing all UI primitives, transit widgets, and states per docs/03.
        </p>
      </header>

      {/* 1. Buttons */}
      <section className="space-y-4">
        <h2 className="text-lg font-semibold text-ink border-b border-line pb-2">
          Buttons (Variants & Sizes)
        </h2>
        <div className="flex flex-wrap items-center gap-3">
          <Button variant="primary">Primary</Button>
          <Button variant="secondary">Secondary</Button>
          <Button variant="accent">Accent Sapphire</Button>
          <Button variant="ghost">Ghost</Button>
          <Button variant="danger">Danger</Button>
          <Button variant="primary" disabled>
            Disabled
          </Button>
          <Button variant="primary" loading>
            Loading
          </Button>
        </div>
        <div className="flex items-center gap-3 pt-2">
          <Button size="lg">Size LG (48px)</Button>
          <Button size="md">Size MD (40px)</Button>
          <Button size="sm">Size SM (32px)</Button>
        </div>
      </section>

      {/* 2. Inputs */}
      <section className="space-y-4 max-w-md">
        <h2 className="text-lg font-semibold text-ink border-b border-line pb-2">
          Inputs & Form Controls
        </h2>
        <Input label="Normal Input" placeholder="Search stop or landmark" />
        <Input
          label="Input with Helper Text"
          defaultValue="Kukatpally Housing Board"
          helperText="Select from nearby verified stops"
        />
        <Input
          label="Error State"
          defaultValue="Unknown stop query"
          error="No stop matches this name. Please verify your query."
        />
        <Input label="Disabled State" disabled defaultValue="Fixed destination: Main campus" />
      </section>

      {/* 3. Segmented Controls & Tabs */}
      <section className="space-y-4">
        <h2 className="text-lg font-semibold text-ink border-b border-line pb-2">
          Segmented Controls & Tabs
        </h2>
        <div className="space-y-3">
          <Segmented
            name="Time Mode"
            value={segmentedTime}
            onChange={setSegmentedTime}
            options={[
              { value: "now", label: "Leave now" },
              { value: "depart", label: "Leave at" },
              { value: "arrive", label: "Arrive by" },
            ]}
          />
          <Segmented
            name="Direction"
            value={segmentedDir}
            onChange={setSegmentedDir}
            options={[
              { value: "to_campus", label: "To campus" },
              { value: "from_campus", label: "From campus" },
            ]}
          />
        </div>

        <div className="pt-4">
          <Tabs defaultValue="mon-fri">
            <TabsList>
              <TabsTrigger value="mon-fri">Mon–Fri</TabsTrigger>
              <TabsTrigger value="sat">Saturday</TabsTrigger>
              <TabsTrigger value="sun" disabled>
                Sunday (No service)
              </TabsTrigger>
            </TabsList>
            <TabsContent value="mon-fri">
              <p className="text-sm text-ink-2 p-3 bg-s1 rounded-md border border-line">
                Showing regular weekday timetable with 4 scheduled morning trips.
              </p>
            </TabsContent>
            <TabsContent value="sat">
              <p className="text-sm text-ink-2 p-3 bg-s1 rounded-md border border-line">
                Showing reduced weekend Saturday timetable.
              </p>
            </TabsContent>
          </Tabs>
        </div>
      </section>

      {/* 4. Route Badges (Palette 1 through 8) */}
      <section className="space-y-4">
        <h2 className="text-lg font-semibold text-ink border-b border-line pb-2">
          Route Badges (Palette 1 to 8, 7:1 Contrast)
        </h2>
        <div className="flex flex-wrap items-center gap-3">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((idx) => (
            <div key={idx} className="flex items-center gap-1.5">
              <RouteBadge code={`R${idx}`} colorIndex={idx} size="md" />
              <span className="text-xs text-ink-3">Palette {idx}</span>
            </div>
          ))}
        </div>
      </section>

      {/* 5. Status Tags & Source Labels */}
      <section className="space-y-4">
        <h2 className="text-lg font-semibold text-ink border-b border-line pb-2">
          Status Tags & Source Labels
        </h2>
        <div className="flex flex-wrap gap-2.5 items-center">
          <StatusTag label="On time" tone="ok" />
          <StatusTag label="Delayed 8 min" tone="warn" />
          <StatusTag label="Cancelled" tone="crit" />
          <StatusTag label="Not tracked" tone="muted" />
        </div>
        <div className="flex flex-wrap gap-6 items-center pt-2">
          <div className="flex items-center gap-2">
            <span className="tabular-nums font-medium">7:42 am</span>
            <SourceLabel source="live" />
          </div>
          <div className="flex items-center gap-2">
            <span className="tabular-nums font-medium">7:55 am</span>
            <SourceLabel source="estimated" />
          </div>
          <div className="flex items-center gap-2">
            <span className="tabular-nums font-medium">8:15 am</span>
            <SourceLabel source="scheduled" />
          </div>
          <div className="flex items-center gap-2">
            <span className="tabular-nums font-medium">--:--</span>
            <SourceLabel source="unavailable" />
          </div>
        </div>
      </section>

      {/* 6. Freshness Indicators */}
      <section className="space-y-4">
        <h2 className="text-lg font-semibold text-ink border-b border-line pb-2">
          Freshness Tags (Clickable for Popover Explainer)
        </h2>
        <div className="flex flex-wrap gap-3 items-center">
          <FreshnessTag
            freshness={{
              state: "verified",
              verified_at: "2026-10-11T00:00:00+05:30",
              days_since: 3,
              valid_to: "2026-12-31",
              message: "Verified 3 days ago",
            }}
          />
          <FreshnessTag
            freshness={{
              state: "aging",
              verified_at: "2026-09-14T00:00:00+05:30",
              days_since: 30,
              valid_to: "2026-12-31",
              message: "Last verified 30 days ago",
            }}
          />
          <FreshnessTag
            freshness={{
              state: "outdated",
              verified_at: "2026-08-01T00:00:00+05:30",
              days_since: 74,
              valid_to: null,
              message: "Schedule may be outdated",
            }}
          />
          <FreshnessTag
            freshness={{
              state: "unverified",
              verified_at: null,
              days_since: null,
              valid_to: null,
              message: "Not yet verified",
            }}
          />
        </div>
      </section>

      {/* 7. Departure Rows */}
      <section className="space-y-2">
        <h2 className="text-lg font-semibold text-ink border-b border-line pb-2">
          Departure Rows (64px Height, Hairline Dividers)
        </h2>
        <div className="border border-line rounded-lg overflow-hidden divide-y divide-line">
          <DepartureRow
            route={{ id: "r1", code: "R1", name: "Miyapur", color_index: 1 }}
            destination="Main campus"
            secondaryText="Platform 2 • Kukatpally HB"
            timeStr="7:42 am"
            countdownText="in 6 min"
            source="live"
            statusText="On time"
            onClick={() => toast({ message: "Selected R1 Live Departure" })}
          />
          <DepartureRow
            route={{ id: "r2", code: "R2", name: "Secunderabad", color_index: 2 }}
            destination="Main campus"
            secondaryText="Opposite Metro Gate"
            timeStr="7:55 am"
            countdownText="in 19 min"
            source="estimated"
            statusText="Delayed 8 min"
            onClick={() => toast({ message: "Selected R2 Estimated Departure" })}
          />
          <DepartureRow
            route={{ id: "r3", code: "R3", name: "Uppal", color_index: 3 }}
            destination="Main campus"
            secondaryText="Ring Road Junction"
            timeStr="8:12 am"
            source="scheduled"
            isCancelled
            onClick={() => toast({ message: "This departure has been cancelled for today." })}
          />
        </div>
      </section>

      {/* 8. Journey Option Cards */}
      <section className="space-y-4">
        <h2 className="text-lg font-semibold text-ink border-b border-line pb-2">
          Journey Option Cards
        </h2>
        <div className="grid gap-3 sm:grid-cols-2">
          <JourneyCard
            option={sampleJourney}
            isSelected={selectedJourney === "opt_1"}
            onSelect={() => setSelectedJourney("opt_1")}
          />
          <JourneyCard
            option={outdatedJourney}
            isSelected={selectedJourney === "opt_2"}
            onSelect={() => setSelectedJourney("opt_2")}
          />
        </div>
      </section>

      {/* 9. Notice Banners */}
      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-ink border-b border-line pb-2">
          Notice Banners (Severity Left Bars)
        </h2>
        <NoticeBanner
          id="n1"
          severity="warning"
          title="Route 2 evening trips diverted via Ameerpet"
          message="Due to emergency water pipeline repairs near Secunderabad Station, buses will take the Ameerpet flyover route. Expect 10-15 minutes additional travel time."
          timestamp="2 hours ago"
          routes={[{ id: "r2", code: "R2", name: "Secunderabad", color_index: 2 }]}
        />
        <NoticeBanner
          id="n2"
          severity="critical"
          title="Severe waterlogging near Dilsukhnagar Depot"
          message="Morning trips delayed by approximately 25 minutes. Transport coordinators are rerouting through alternative arterial corridors."
          timestamp="Just now"
          routes={[{ id: "r3", code: "R3", name: "Uppal", color_index: 3 }]}
        />
        <NoticeBanner
          id="n3"
          severity="info"
          title="Semester end examination special bus schedule"
          message="Additional morning and evening services are active this week for all departments."
          timestamp="Yesterday"
        />
      </section>

      {/* 10. Stop Timeline */}
      <section className="space-y-4 max-w-md">
        <h2 className="text-lg font-semibold text-ink border-b border-line pb-2">
          Stop Timeline (Route Line & Node Highlights)
        </h2>
        <div className="p-4 border border-line rounded-lg bg-paper">
          <StopTimeline
            colorIndex={1}
            stops={[
              { stopId: "s1", name: "Miyapur Metro", timeStr: "7:30 am", isPassed: true },
              { stopId: "s2", name: "Kukatpally Housing Board", timeStr: "7:42 am", isBoarding: true },
              { stopId: "s3", name: "JNTU Metro", timeStr: "7:55 am", secondaryText: "Near Gate 1" },
              { stopId: "s4", name: "Main Campus", timeStr: "8:25 am", isAlighting: true },
            ]}
          />
        </div>
      </section>

      {/* 11. Dialogs & Toasts */}
      <section className="space-y-4">
        <h2 className="text-lg font-semibold text-ink border-b border-line pb-2">
          Dialogs & Toasts
        </h2>
        <div className="flex flex-wrap gap-3">
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="secondary">Open Confirmation Dialog</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Mark Route as Verified?</DialogTitle>
                <DialogDescription>
                  This will reset the freshness clock for Route 1 (Miyapur to Campus) to Verified
                  today.
                </DialogDescription>
              </DialogHeader>
              <DialogFooter>
                <Button variant="primary">Confirm and Verify</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <Button
            variant="secondary"
            onClick={() =>
              toast({
                message: "Published notice to 214 followers",
                actionText: "Undo",
                onAction: () => console.log("Undo action clicked"),
              })
            }
          >
            Trigger Toast
          </Button>
        </div>
      </section>

      {/* 12. Skeletons */}
      <section className="space-y-4">
        <h2 className="text-lg font-semibold text-ink border-b border-line pb-2">
          Loading Skeletons (Geometry-Matched)
        </h2>
        <div className="space-y-3 max-w-md">
          <div className="flex items-center gap-3">
            <Skeleton className="w-8 h-8 rounded-sm" />
            <div className="space-y-1.5 flex-1">
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-3 w-1/2" />
            </div>
            <Skeleton className="h-6 w-16" />
          </div>
          <Skeleton className="h-28 w-full rounded-lg" />
        </div>
      </section>
    </div>
  );
}

export default function DevComponentsPage() {
  return (
    <ToastProvider>
      <ComponentShowcase />
    </ToastProvider>
  );
}
