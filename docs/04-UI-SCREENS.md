# 04. UI screens

Mobile first. Each screen lists purpose, layout, content, and behaviours. Wireframes are mobile (360 px) unless stated. Desktop rules are in section 6.

Navigation (student): bottom tabs **Plan**, **Map**, **Notices**, **Account**.

---

## S1. Home (Plan tab)

Purpose: get to a result within ten seconds.

```
┌──────────────────────────────┐
│ CollegeNav            [Bell] │  top bar: wordmark (serif), notices bell with count
│                              │
│ Where to today?              │  display serif, 40/44
│                              │
│ ┌──────────────────────────┐ │
│ │ o  From: Current location│ │  search card (r-lg, 1px line-strong)
│ │ ───────────────  [swap]  │ │
│ │ ■  To: Main campus       │ │
│ └──────────────────────────┘ │
│ [Leave now|Leave at|Arrive by]│  segmented control
│ [        Find buses        ] │  primary, 48 high
│                              │
│ ┌ Disruption ──────────────┐ │  notice banner (only if active)
│ │ Route 3 diverted today   │ │
│ └──────────────────────────┘ │
│                              │
│ Near you                     │  heading
│ Kukatpally Housing Board     │  stop rows, distance on right
│ R3 R5    next 7:42 am  420 m │
│ ─────────────────────────────│
│ JNTU Metro                   │
│ R3       next 7:55 am  790 m │
│                              │
│ Saved                        │
│ Home, Miyapur               │
│                              │
├──────────────────────────────┤
│  Plan   Map   Notices  Acct  │
└──────────────────────────────┘
```

Behaviours:
- "From" defaults to current location if permission already granted, else last used, else empty.
- "Near you" appears only with location. Shows up to 3 stops within 1 km with next departure.
- Saved places shown only for signed-in users with entries.
- Banner shows the highest-severity active notice, with "n more" link when several.

---

## S2. Place picker (full-screen sheet)

```
┌──────────────────────────────┐
│ [X]  From                    │
│ ┌──────────────────────────┐ │
│ │ Search stop or landmark  │ │
│ └──────────────────────────┘ │
│ Use my location             │  row with LocateFixed
│ Choose on map               │
│                              │
│ Saved                        │
│ Nearby                       │
│ Stops                        │
│ Landmarks                    │
└──────────────────────────────┘
```

- Search starts after 1 character, debounced 150 ms.
- Matching is trigram on name, code and landmark aliases (e.g. "KPHB" finds Kukatpally Housing Board).
- Highlight matched text in `ink` 600, remainder `ink-2`.
- Recent searches stored in local storage only.

---

## S3. Results

Presented as a bottom sheet over a map that already shows the journeys.

```
┌──────────────────────────────┐
│ ░░░░░░░ MAP ░░░░░░░░░░░░░░░░ │
│ ░░░░ selected journey ░░░░░░ │
│ ┌──────────────────────────┐ │
│ │ ═══                      │ │  sheet grabber
│ │ 3 options , Leave now   │ │
│ │                          │ │
│ │ ┌ Best option ─────────┐ │ │
│ │ │ [R3] Board at KPHB   │ │ │
│ │ │ 7:42 am ──42 min── 8:24│ │
│ │ │ 6 min walk, 9 min wait│ │
│ │ │ Live                  │ │
│ │ └──────────────────────┘ │ │
│ │ ┌ [R5] ... ┐             │ │
│ └──────────────────────────┘ │
└──────────────────────────────┘
```

Content per card: see "Journey option card" in the design system.

Behaviours:
- First card auto-selected and drawn on the map.
- Tap another card to switch, line redraws.
- Tap the card body to open Route detail with journey context. Tap source label to read what it means.
- Filter row (secondary segmented): Earliest, Least walking, Fewest changes (P2).
- If a result belongs to an Outdated route, the card shows the freshness tag "Schedule may be outdated" in the top-right.

### S3b. No results

```
 No bus passes within 800 m of Madhapur.
 The closest stop is Hitec City Circle, 1.4 km away (R6).

 [Show Hitec City Circle] [Widen walking distance to 1.5 km]
 [Contact transport office]
```

The explanation is derived from the engine (`reason` code in the API). Never a blank screen.

---

## S4. Route detail

```
┌──────────────────────────────┐
│ [<]                          │
│ [R3]  Kukatpally to Campus   │  title-1 serif
│ Verified 3 days ago          │  freshness tag
│ ┌ Delay ───────────────────┐ │  banner if any
│ └──────────────────────────┘ │
│ [To campus | From campus]    │  segmented direction
│                              │
│ Next bus  7:42 am            │  numeral-lg
│ in 9 min, Scheduled         │
│                              │
│ ───────── map (180 px) ──────│
│                              │
│ Stops                        │
│ 7:30  o Miyapur              │  stop timeline
│ 7:42  ● Kukatpally HB   [Board]│ highlighted when journey context
│ 7:55  o JNTU Metro           │
│ 8:20  o Ameerpet             │
│ 8:55  ■ Main campus          │
│                              │
│ Timetable                    │
│ [Mon–Fri | Sat | Sun]        │
│ 7:00  7:30  8:00  8:30 ...   │  chip grid, cancelled struck
│                              │
│ [ Follow route ]             │
└──────────────────────────────┘
```

- Map section expands to full screen on tap with the timeline in a sheet.
- Timetable shows times at the stop in context (or the first stop if none).
- The days shown reflect the real calendar. Today's cancelled trips struck through.

---

## S5. Stop detail

```
 [<]  Kukatpally Housing Board        title-2 serif
      Near KPHB Colony Gate 2         body-sm ink-3
 Step-free access: Yes                body-sm
 Routes: [R3] [R5]

 Next departures
 [R3] To campus        7:42 am   in 9 min
                       Live
 [R5] To campus        7:55 am   in 22 min
                       Scheduled
 [R3] To campus        8:12 am   Cancelled   (struck)
 ...
 [Show all day]  [Follow stop]
```

Notes: departures drawn from `trip_instances` for today, merging cancellations and delays. After 10 pm shows tomorrow's first departures labelled with date.

---

## S6. Live trip (from a departure)

```
 ───────── map (full) ────────
  bus dot moving on line
 ┌ sheet ─────────────────────┐
 │ [R3] To campus     Live    │
 │ Bus TS09 1234              │
 │ Now between JNTU Metro and │
 │ Ameerpet                   │
 │                            │
 │ Your stop  Kukatpally HB   │
 │ Arriving in 6 min          │  numeral-lg
 │ Estimated                  │
 │                            │
 │ Upcoming stops             │
 │ 8:03 Ameerpet  (+3 min)    │
 │ ...                        │
 └────────────────────────────┘
```

- Signal lost: marker greys out, caption "Last seen 3 min ago". ETA becomes "Estimated from schedule".
- Not tracked trip: map shows route only, sheet says "Live tracking isn't available for this trip. Showing the schedule."

---

## S7. Map tab

- Full-screen map with all active routes (selected one at full opacity).
- Top: search field (opens place picker) and a layers control (Routes, Stops, Live buses toggles).
- Bottom chips: a horizontally scrolling list of route badges to focus. Tap isolates.
- Tap stop opens Stop detail as half sheet. Tap bus opens live trip sheet.
- List view toggle (List icon) switches to a route list for accessibility.

---

## S8. Notices tab

```
 Notices                         title-1 serif
 [Active | Earlier]              segmented
 ┌ Disruption ────────────────┐
 │ Route 3 diverted via ...   │
 │ From 7:00 am today, [R3]  │
 │ Posted by Transport Office │
 └────────────────────────────┘
 ┌ Delay ... ┐
```

- Filter by routes the user follows (toggle "Only my routes").
- Each card opens a detail sheet with full message, affected stops list, start and end.
- "Earlier" lists the past 30 days.

---

## S9. Account

- Not signed in: explanation of what signing in adds (follow routes, saved places, push) and a single field "College email". Sign in via email code.
- Signed in: Following (routes and stops, toggles per channel), Saved places, Notification permission status with enable button, Sign out.
- About: data sources, how freshness works, contact.

---

## Admin console (desktop first, usable on tablet)

Layout: left nav (240 px) with Dashboard, Operations, Routes, Stops, Buses, Timetable, Notices, Audit log, Settings. Top bar shows page title (serif), search, and the signed-in admin.

### A1. Dashboard

```
 Good morning, Mr. Rao                           title-1 serif
 ┌ Live now ──┐ ┌ Active notices ┐ ┌ Needs attention ┐
 │ 6 trips    │ │ 2              │ │ 3 routes        │
 │ 4 live     │ │ [Manage]       │ │ not verified    │
 └────────────┘ └────────────────┘ └─────────────────┘

 Today's trips                           [Cancel] [Delay]
 Time  Route  Bus      Driver   Status     Tracking
 7:00  R1     TS09..   Ravi     Running    Live
 7:30  R3     TS09..   Suresh   Delayed 8  Live
 ...
 Needs verification
 R4   Not verified since 14 Aug     [Verify]
```

- Three summary blocks are separated by hairlines, not stacked cards with shadows. Large numerals use serif.

### A2. Routes list and editor

List: table with code, name, direction coverage, number of stops, trips per day, freshness, status, last edited.

Editor (two columns):

```
 Left (form + sequencer)                   Right (map)
 Name, code, colour, valid dates           Stops draggable on map
 Direction [To campus | From campus]       Route line preview
 Stop sequence                             
  ⋮⋮ 1 Miyapur            +0 min  [x]      
  ⋮⋮ 2 Kukatpally HB      +12 min [x]      
  [Add stop]                               
 [Save draft] [Save and mark verified]
```

- Drag handle reorders. Offsets are validated as strictly increasing.
- Unsaved change bar sticks to the bottom with a diff count.
- Saving shows a diff dialog: added, removed, moved stops, changed offsets.

### A3. Stops

Table with map split. Click a row to focus pin. Add stop by clicking map or entering coordinates. Fields: name, code, landmark aliases (tags), step-free access, active.

### A4. Buses

Table: registration, name, capacity, default route, driver, status (Active, In maintenance), last seen. Add and edit via side panel.

### A5. Timetable (trips)

Grid: rows are routes and directions, columns are times. Click cell to edit. Weekday selector per trip. Bulk "Copy Mon–Fri to Sat". Validation highlights bus conflicts (same bus in two trips overlapping).

### A6. Notices

List with status Draft, Live, Ended. Composer is a two-pane view:

```
 Left: fields                       Right: preview as students see it
 Type [Delay ▾]  Severity [Warning]   (banner + feed card + push text)
 Title, Message (max 280)
 Affects: Routes [R3 x] Stops [..] Trips [..]
 Active from [now]  to [today 11:59 pm]
 Reach: 214 followers
 [Save draft]  [Publish]
```

- Push text shown separately and capped at 110 characters.
- Publishing requires one confirm when severity is Critical.

### A7. Operations (today)

Table of today's trip instances with row actions: Cancel, Delay by n min, Reassign bus. Every action opens a small dialog with a reason and an optional "Notify followers" toggle on by default.

### A8. Audit log

Chronological table: time, admin, action, entity, summary. Expand row to see before and after JSON in a monospace block. Filter by entity and admin.

### A9. Settings

Walk radius default, walking speed, freshness thresholds (Verified within, Aging until), delay notification threshold, push enabled, driver codes.

---

## Driver mode (mobile only, high contrast, large targets)

```
 CollegeNav Driver
 Bus TS09 UB 1234

 Today
 7:00 am  R1 To campus     [Start]
 7:30 am  R3 To campus     [Start]
```

Active trip:

```
 R3 To campus                       Broadcasting
 ─────────────────────────────────
 Now      Miyapur
 Next     Kukatpally HB  in about 6 min

 [          Running late          ]
 [          Breakdown             ]
 [           End trip             ]
```

- Buttons 64 px high. "End trip" requires a press-and-hold of 1 second.
- "Broadcasting" indicator is the sapphire square pulsing. If location fails: red banner with "Location off. Turn on location to keep students updated."

---

## 6. Desktop adaptation (student)

- Two-pane: fixed left panel 420 px (what is a bottom sheet on mobile), map fills remaining space.
- Tabs move to a slim top navigation.
- Results, route detail and stop detail replace the left panel content, with a back control.
- The map never overlays the left panel.

## 7. Content rules

- Stop names in Title Case as the college uses them. Routes: code plus name, "R3 Kukatpally to Campus".
- Times: "7:42 am". Durations: "42 min". Distances: "420 m", "1.4 km".
- Never show seconds. Never show raw coordinates to students.
- Use "Main campus" as the default campus label until admin sets another.
