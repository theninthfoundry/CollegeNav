# 05. UX specification

How the product behaves when things are good, slow, wrong or missing. Pair with `03-DESIGN-SYSTEM.md` (look) and `04-UI-SCREENS.md` (layout).

## 1. Voice and copy

- Plain, short, active. Sentence case. No exclamation marks, no emoji, no jargon.
- Name things the way students do: "bus", "stop", "route", "campus". Not "trip instance" or "headway".
- Errors explain what happened and what to do. They never apologise or blame.
- An action keeps its name through the flow: the button "Publish" yields the toast "Published".

### Core strings

| Situation | Copy |
|---|---|
| Home heading | Where to today? |
| Primary button | Find buses |
| Time modes | Leave now, Leave at, Arrive by |
| Best result tag | Best option |
| Source labels | Live, Estimated, Scheduled, Unavailable |
| Freshness | Verified 3 days ago, Last verified 28 days ago, Not verified since 14 Aug, Schedule may be outdated |
| On time / delayed | On time, Delayed 8 min |
| Cancelled | Cancelled |
| Not tracked | Live tracking isn't available for this trip. Showing the schedule. |
| Signal lost | Last seen 3 min ago. Estimating from the schedule. |
| Follow | Follow route, Following |
| Push prompt | Get notified when Route 3 changes. We only send updates for routes you follow. |
| Publish toast | Published to 214 followers |
| Verify toast | Marked as verified |
| Unsaved changes | You have 3 unsaved changes |

## 2. State matrix

Every data-driven component implements all six states.

| State | Pattern |
|---|---|
| Loading | Skeleton with final geometry. No spinners except inside buttons. |
| Empty | Heading, one sentence, one action. |
| Partial | Show what we have; label what we do not. |
| Stale | Show data with "Last updated 14 min ago" and a Refresh action. |
| Error | Explain, offer Retry. Keep previous data visible if we have it. |
| Offline | Banner "You're offline. Showing saved timetables." Live features disabled with explanation. |

### Empty and error copy

| Where | Heading | Body | Action |
|---|---|---|---|
| No results | No bus passes within 800 m | The closest stop is {stop}, {distance} away. | Show {stop}, Widen distance |
| No departures today | No more buses today | The next bus is tomorrow at {time}. | See tomorrow |
| Route suspended | Route 3 is not running | {reason}. Service resumes {date or "on a date to be announced"}. | See other routes |
| Route outdated | This schedule may be outdated | It was last verified {date}. Check with the transport office before relying on it. | Contact transport office |
| No notices | Nothing to report | Service notices appear here. | None |
| Location denied | Location is off | Search for your stop instead. | Search stops |
| Network error | Couldn't load buses | Check your connection and try again. | Retry |
| Admin save conflict | Someone else changed this | Reload to see their changes before saving yours. | Reload |

## 3. Honesty rules (outcome 09 in practice)

1. **Source label on every time.** Live, Estimated or Scheduled sits under the numeral or after the row time.
2. **Label degradation is automatic.** Live degrades to Estimated at 30 s of silence and to Scheduled at 120 s.
3. **Freshness on every route and timetable.** If it is Outdated, a banner sits above the content and results are not ranked as Best option.
4. **Unavailable is explicit.** A suspended route, a stop out of service, an expired validity window each have a reason string from the admin.
5. **No guessing.** If no schedule exists for a day, say "No service on Sundays". Never hide the route.
6. **Last updated** is shown on any screen served from cache.

## 4. Interaction details

### Place picker
- Autofocus on open. Return key selects the first suggestion.
- Swap control exchanges from and to and keeps focus.
- "Use my location" shows an inline "Finding you" state up to 6 s, then falls back to search with a message.

### Results and map
- Selecting a result moves the camera to fit the journey with 80 px padding, route line draws over 480 ms.
- Sheet can be dragged between peek, half, full. A visible "Show map" and "Show list" control provides a non-drag alternative.
- Back from Route detail restores the previous sheet snap and scroll position.

### Follow and notifications
- Following a route is one tap. The first follow triggers the push permission explainer (our own sheet first, browser prompt only after the user agrees).
- If permission is denied, following still works in-app. A quiet line says "Push is off. You'll see updates here."

### Live tracking
- Marker interpolates between GPS points over 4.5 s so it glides rather than jumps.
- Auto-follow the bus only while the user has not panned. Panning pauses follow; a "Recentre" control returns.
- ETA text changes at most once per 15 s to avoid flicker. Changes announce politely to screen readers.

### Admin editing
- Autosave drafts of notices locally every 3 s.
- Destructive actions (archive route, end notice) use a confirm dialog naming the object and its consequence.
- Keyboard: `g r` go to routes, `g n` notices, `/` focus search, `Cmd/Ctrl+K` command palette (P2).
- Optimistic UI for toggles; roll back with an inline error if the write fails.

### Driver mode
- Wake Lock requested on start. If unsupported, show a hint "Keep this screen on."
- If GPS accuracy exceeds 50 m, show "Weak location" but continue sending, with an accuracy field.
- Press-and-hold to end prevents accidental taps.

## 5. Accessibility checklist

- Semantic landmarks (`header`, `nav`, `main`). Skip link on every page.
- All interactive elements reachable by keyboard; focus order follows visual order.
- Focus ring: 2 px `accent`, 2 px offset, always visible.
- Targets at least 44 × 44 px.
- Status never by colour alone (tone square plus text).
- `aria-live="polite"` for ETA, notices; `assertive` for Critical notices only.
- Bottom sheet exposes `role="dialog"` where modal, with focus trap and Escape to close.
- Map is not the only way to do anything: list views exist for routes, stops, and live buses.
- Respect `prefers-reduced-motion` and `prefers-color-scheme` (v1 light only, tokens ready for dark).
- Text resizes to 200% without loss. Minimum 12 px.
- Test with VoiceOver and TalkBack for Plan, Route detail, Notices at minimum.

## 6. Offline and performance behaviour

- PWA service worker: cache app shell and static assets (cache-first), timetable and stops JSON (stale-while-revalidate, 24 h), map tiles (network-first, capped).
- On first load the timetable endpoint is prefetched so Plan can run offline using a client-side version of the planner over cached data (P2). In v1, offline shows cached route and stop pages only.
- Map and MapLibre are lazy-loaded. Home renders before the map script arrives.
- Images: none in the product, so no layout shift from media.
- Target bundle: under 180 KB JS on Home (excluding the map chunk).

## 7. Notification design

| Channel | When | Format |
|---|---|---|
| In-app banner | Notice active and affects what the user is viewing | Banner component |
| Notices feed | Always | Cards |
| Web push | Notice published or escalated, for followers of affected routes | Title: "Route 3 delayed". Body: one sentence, max 110 characters. Tapping opens the notice. |

Rules: no more than 3 pushes per user per day unless Critical. Quiet hours 10 pm to 5 am for non-critical. Updates to an existing notice replace the earlier push (same tag).

## 8. Telemetry (privacy safe)

Events: `plan_searched` (result count only), `plan_no_result` (origin stop id or cell id rounded to 500 m), `route_viewed`, `notice_opened`, `follow_toggled`, `push_enabled`. No user location, no persistent identifiers for anonymous users.
