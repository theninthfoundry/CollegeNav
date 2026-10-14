# 03. Design system

Direction: **bold minimalism**. White surfaces, true black type, hairline structure, one deep accent, rich but sober route colours. It should feel like a premium transit product: quiet, exact, confident.

## 1. Principles

1. **Type does the work.** Large, well-set numerals and headings carry hierarchy. Not boxes, not shadows, not icons.
2. **Structure through hairlines.** 1 px borders and generous space. Shadows only on things that float over the map.
3. **One accent, used sparingly.** Sapphire marks the selected, the active and the live. Everything else is black, grey or white.
4. **Colour means something.** Route colours identify routes. Status colours report status. Neither is decoration.
5. **Honest by default.** Source and freshness labels are part of the visual language, not footnotes.
6. **Restraint with motion.** One signature moment (the route line drawing onto the map). Everything else is functional.
7. **No ornament.** No gradients, no illustrations, no emoji, no decorative icons.

### Things we deliberately avoid
- ALL CAPS labels and tracked-out eyebrows. Use sentence case.
- Arrows appended to button text.
- Identical rounded cards stacked everywhere. Radius and treatment vary with role.
- Dot-joined meta strings ("A · B · C"). Use proper layout or commas.
- Gradient washes, glassmorphism, coloured shadows.
- Tinted near-black. Text is true black.

## 2. Colour

### Core
| Token | Hex | Use |
|---|---|---|
| `paper` | `#FFFFFF` | Page and card background |
| `surface-1` | `#FAFAFA` | Quiet panels, table header, input hover |
| `surface-2` | `#F4F4F5` | Skeletons, selected rows, segmented control track |
| `line` | `#E6E6E8` | Hairlines, card borders, dividers |
| `line-strong` | `#CFCFD4` | Input borders, focus-adjacent borders |
| `ink` | `#000000` | Headings, primary text, primary button |
| `ink-2` | `#3F3F46` | Body secondary |
| `ink-3` | `#6B6B73` | Captions, metadata (5.1:1 on white) |
| `ink-4` | `#9A9AA2` | Placeholders and disabled only. Never essential text |

### Accent: Sapphire
| Token | Hex | Use |
|---|---|---|
| `accent` | `#0F2F6B` | Links, selected state, focus ring, live indicator |
| `accent-hover` | `#0A2352` | Hover and pressed |
| `accent-tint` | `#E8EEF9` | Selected background, journey highlight |
| `accent-line` | `#C9D6F0` | Selected borders |

### Status
Each status has a foreground, a tint, and a **shape or word** so colour is never the only signal.

| Status | Foreground | Tint | Meaning |
|---|---|---|---|
| `ok` | `#0B6B47` | `#E6F4EC` | On time, Verified |
| `warn` | `#8A5300` | `#FBF1DF` | Delayed, Aging |
| `crit` | `#A61B1B` | `#FBE9E9` | Cancelled, Disrupted, Outdated |
| `muted` | `#5C5C66` | `#F1F1F3` | Unverified, Unavailable, Not tracked |

### Route palette (eight, assigned in order)
All pass 7:1 with white text.

| # | Name | Hex |
|---|---|---|
| 1 | Sapphire | `#0F2F6B` |
| 2 | Forest | `#14532D` |
| 3 | Oxblood | `#7A1F2B` |
| 4 | Teal | `#0E5F6B` |
| 5 | Plum | `#4A2268` |
| 6 | Rust | `#8F3A12` |
| 7 | Olive | `#55601A` |
| 8 | Slate | `#334155` |

Route colour is stored as a palette index (1 to 8), not a hex, so the palette can change without a migration.

## 3. Typography

| Role | Family | Why |
|---|---|---|
| Display and page titles | **Instrument Serif** (400, italic available) | Editorial, premium, distinctive against a clean UI |
| Interface and body | **Geist Sans** (400, 500, 600) | Precise, modern, excellent numerals |

Both load via `next/font` (Google Fonts). Fallback stack: `ui-sans-serif, system-ui, "Segoe UI", Roboto, sans-serif` and `Georgia, serif`.

Use `font-variant-numeric: tabular-nums` on every time, countdown and table number so columns align.

### Scale
| Token | Size / line | Family, weight | Use |
|---|---|---|---|
| `display` | 56/60 (desktop), 40/44 (mobile) | Serif 400, -0.01em | Home hero line |
| `title-1` | 36/42 (desktop), 30/36 (mobile) | Serif 400 | Screen titles |
| `title-2` | 24/30 | Serif 400 | Section titles, sheet titles |
| `heading` | 18/26 | Sans 600, -0.01em | Card headings, list group titles |
| `body` | 16/24 | Sans 400 | Default |
| `body-sm` | 14/20 | Sans 400 | Secondary and dense UI |
| `label` | 14/20 | Sans 500 | Buttons, field labels, tabs |
| `caption` | 12/16 | Sans 400 | Source labels, helper text |
| `numeral-lg` | 40/44 | Sans 500, tabular, -0.02em | Departure time, countdown |
| `numeral-md` | 24/28 | Sans 500, tabular | Row times |

Rules: line length under 70 characters. Sentence case everywhere. Never below 12 px. Numerals in tables right-aligned.

## 4. Spacing, layout, radius, elevation

- **Base unit** 4 px. Scale: 4, 8, 12, 16, 20, 24, 32, 40, 48, 64, 80, 96.
- **Mobile**: 16 px gutters. Bottom tab bar 56 px plus safe area.
- **Desktop student app**: split view. Left panel 420 px, map fills the rest.
- **Admin**: left nav 240 px, content max 1200 px, 24 px gutters.
- **Touch targets**: 44 px minimum.

| Radius | Value | Used for |
|---|---|---|
| `r-sm` | 6 | Route badge, status tag, chips |
| `r-md` | 8 | Buttons, inputs |
| `r-lg` | 12 | Panels, result cards, popovers |
| `r-sheet` | 20 (top only) | Bottom sheets |
| `r-full` | 999 | Map markers, avatar only |

Elevation: default is **no shadow**, use `line`. Floating elements only:
- `float`: `0 8px 24px rgba(0,0,0,0.08), 0 1px 2px rgba(0,0,0,0.06)` for map overlays, popovers, sheets.

## 5. Tokens (copy to `src/styles/tokens.css`)

```css
:root {
  --paper: #ffffff;
  --surface-1: #fafafa;
  --surface-2: #f4f4f5;
  --line: #e6e6e8;
  --line-strong: #cfcfd4;
  --ink: #000000;
  --ink-2: #3f3f46;
  --ink-3: #6b6b73;
  --ink-4: #9a9aa2;

  --accent: #0f2f6b;
  --accent-hover: #0a2352;
  --accent-tint: #e8eef9;
  --accent-line: #c9d6f0;

  --ok: #0b6b47;       --ok-tint: #e6f4ec;
  --warn: #8a5300;     --warn-tint: #fbf1df;
  --crit: #a61b1b;     --crit-tint: #fbe9e9;
  --muted: #5c5c66;    --muted-tint: #f1f1f3;

  --route-1: #0f2f6b; --route-2: #14532d; --route-3: #7a1f2b; --route-4: #0e5f6b;
  --route-5: #4a2268; --route-6: #8f3a12; --route-7: #55601a; --route-8: #334155;

  --r-sm: 6px; --r-md: 8px; --r-lg: 12px; --r-sheet: 20px;
  --float: 0 8px 24px rgba(0,0,0,.08), 0 1px 2px rgba(0,0,0,.06);

  --ease: cubic-bezier(.2,.7,.2,1);
  --dur-fast: 120ms; --dur: 200ms; --dur-slow: 480ms;

  --font-sans: var(--font-geist), ui-sans-serif, system-ui, "Segoe UI", Roboto, sans-serif;
  --font-serif: var(--font-instrument), Georgia, serif;
}

@media (prefers-reduced-motion: reduce) {
  :root { --dur-fast: 0ms; --dur: 0ms; --dur-slow: 0ms; }
}
```

### Tailwind mapping (`tailwind.config.ts` essentials)

```ts
export default {
  theme: {
    extend: {
      colors: {
        paper: "var(--paper)", s1: "var(--surface-1)", s2: "var(--surface-2)",
        line: "var(--line)", "line-strong": "var(--line-strong)",
        ink: { DEFAULT: "var(--ink)", 2: "var(--ink-2)", 3: "var(--ink-3)", 4: "var(--ink-4)" },
        accent: { DEFAULT: "var(--accent)", hover: "var(--accent-hover)", tint: "var(--accent-tint)", line: "var(--accent-line)" },
        ok: { DEFAULT: "var(--ok)", tint: "var(--ok-tint)" },
        warn: { DEFAULT: "var(--warn)", tint: "var(--warn-tint)" },
        crit: { DEFAULT: "var(--crit)", tint: "var(--crit-tint)" },
        muted: { DEFAULT: "var(--muted)", tint: "var(--muted-tint)" },
      },
      borderRadius: { sm: "6px", md: "8px", lg: "12px", sheet: "20px" },
      fontFamily: { sans: ["var(--font-sans)"], serif: ["var(--font-serif)"] },
      boxShadow: { float: "var(--float)" },
    },
  },
};
```

## 6. Iconography

Library: **Lucide**, stroke 1.5, size 20 (16 in dense rows). Icons are functional only, always paired with text unless the control is universally understood (close, back).

Allowed set: `Search`, `MapPin`, `LocateFixed`, `Clock`, `Bell`, `BellOff`, `ChevronRight`, `ChevronDown`, `ChevronLeft`, `X`, `Check`, `Info`, `TriangleAlert`, `Plus`, `Pencil`, `Trash2`, `GripVertical`, `ArrowUpDown` (swap from/to), `Menu`, `Map`, `List`, `Layers`, `ShieldCheck`, `Upload`, `Download`.

No bus cartoon, no emoji, no filled icons. The bus on the map is a coloured dot with a heading wedge.

## 7. Components

Each component lists anatomy, variants, states. Build with Radix primitives, styled with Tailwind, in `src/components/ui`.

### Button
- Variants: `primary` (ink fill, white text), `secondary` (white, 1 px `line-strong`), `ghost` (text only), `accent` (sapphire fill, used once per screen at most), `danger` (crit fill).
- Sizes: `lg` 48, `md` 40, `sm` 32. Radius `r-md`. Label 14/500.
- States: hover (primary to `#1a1a1a`, secondary to `surface-1`), pressed (scale 0.98, 80 ms), focus (2 px `accent` ring with 2 px paper offset), disabled (`ink-4` text on `surface-2`), loading (spinner replaces label width-locked).

### Search field (trip planner)
- Two stacked fields with a swap control between them. 1 px `line-strong` border on a shared container, `r-lg`. A left dot marks origin (hollow, ink) and a square marks destination (solid, ink); a hairline connects them.
- Placeholders: "From: stop, landmark or location" and "To: campus or any stop".
- Suggestions open as a list below with grouped headings: Nearby, Stops, Landmarks, Saved.

### Route badge
- 28 px square (32 on result cards), `r-sm`, route colour fill, white 14/600 text with the route code ("R3"). Never use the route colour for text on white except for the badge itself.

### Status tag
- 24 px height, `r-sm`, tint background, foreground text, 12/500. Examples: "On time" (ok), "Delayed 8 min" (warn), "Cancelled" (crit), "Diverted" (warn), "Not tracked" (muted).
- Always includes text. A 6 px leading square marks the tone for scanability.

### Source label (the signature element)
- Inline caption beside a time. Text only, 12/16, `ink-3`.
- `Live` is `accent` with a 6 px square that pulses once every 2 s (only when motion allowed).
- Values: Live, Estimated, Scheduled, Unavailable.
- Appears under every `numeral-lg` and after every row time.

### Freshness indicator
- Compact tag on routes and timetables.
- Verified (ok), Aging (warn), Outdated (crit), Unverified (muted).
- Text: "Verified 3 days ago", "Last verified 28 days ago", "Not verified since 14 Aug", "Schedule may be outdated".
- Tapping opens a popover: what it means, when and by whom verified, valid dates.

### Departure row
- Left: route badge. Middle: destination (body, 500) and secondary line (platform or stop name, `ink-3`). Right: time in `numeral-md`, countdown in `caption`. Source label under the time.
- Cancelled: time and destination struck through in `ink-3`, status tag "Cancelled" shown.
- Row height 64. Divider `line`. Entire row tappable.

### Journey option card
- Container 1 px `line`, `r-lg`, 16 padding.
- Top: route badge, "Board at Kukatpally Housing Board", source label.
- Center: `numeral-lg` depart time left, arrive time right, with a thin 1 px line between and ride duration above it.
- Bottom: three compact figures, "6 min walk", "9 min wait", "42 min ride", in `body-sm`.
- Selected: `accent-line` border, `accent-tint` background. First result carries the text "Best option" in `label`, not a ribbon.

### Stop timeline
- Vertical list. 2 px line in route colour, 10 px hollow circles at stops (white fill, route-colour 2 px border), 14 px solid for boarding and alighting stops.
- Time column left (tabular), stop name right, secondary text for landmark or accessibility notes.
- Passed stops (live) turn `ink-4`. Current segment shows the bus marker.

### Notice banner
- Full width, 1 px border and tint in severity colour, left 3 px bar in foreground colour.
- Title (label, 600), message (body-sm, 2 lines max, expandable), timestamp, affected route badges.
- Severity text is explicit: "Disruption", "Delay", "Information".

### Bottom sheet
- `r-sheet` top corners, `float` shadow, 4 × 36 px grabber in `line-strong`.
- Snap points: peek (112 px), half (50%), full (92%). Drag with velocity, keyboard accessible alternative button.
- On desktop it becomes the fixed left panel.

### Tabs and segmented control
- Segmented: track `surface-2`, selected segment white with 1 px `line`. Used for Leave now / Leave at / Arrive by and direction toggle.
- Bottom tab bar: four items (Plan, Map, Notices, Account), 56 px, label always visible, active item ink with 2 px top rule in `accent`.

### Inputs
- 44 px height, `r-md`, 1 px `line-strong`, focus 2 px `accent` ring. Label above in `label`. Helper and error text in `caption` below, error in `crit` with an icon-free explicit message.

### Data table (admin)
- Header row `surface-1`, 12/500 `ink-3`, sentence case. Rows 52 px, hairline separators, hover `surface-1`. Numerals tabular and right-aligned. Sticky header. Row actions appear on hover and always on touch.

### Dialogs, toasts, popovers
- Dialog: 480 px max, `r-lg`, `float`. Title in serif title-2. Primary action right.
- Toast: bottom-center mobile, bottom-left desktop. Ink background, white text, 4 s. Action text in white underline.
- Popover: white, `r-lg`, 1 px `line`, `float`.

### Skeletons
- `surface-2` blocks matching final geometry, 1.4 s opacity shimmer between 0.6 and 1 (disabled for reduced motion).

### Empty and error blocks
- Title in `heading`, one sentence explaining, one action button. No illustration. Specified in `05-UX-SPEC.md`.

## 8. Map styling

- Base: OpenFreeMap `positron` style (light, low-contrast), labels toned to `ink-3`.
- Route line: 4 px route colour over a 7 px white casing. Non-selected routes drop to 40% opacity.
- Stops: 8 px white circle with 2 px route-colour stroke. Selected stop: 12 px, ink stroke.
- Boarding and alighting stops on a journey: 14 px solid with label chip.
- Bus marker: 18 px route-colour circle, 3 px white border, `float` shadow, 10 px heading wedge. Label chip beside it with route code and bus number appears at zoom 14 and above.
- User location: 12 px sapphire dot with 3 px white border and soft 24 px halo at 10% opacity.
- Controls: custom, 40 px white squares with `r-md` and 1 px `line`, stacked top-right: zoom, locate, layers.
- Signature motion: when a journey is selected, the route line draws from boarding to alighting stop over 480 ms, camera fits bounds with 80 px padding.

## 9. Motion

| Moment | Spec |
|---|---|
| Sheet snap | 280 ms, spring-like ease-out |
| Route line draw | 480 ms, `--ease` |
| Page and panel change | 200 ms fade only, no slide |
| Button press | 80 ms scale 0.98 |
| Live pulse | 2 s loop, 6 px square, opacity 1 to 0.4 |
| Bus marker movement | Interpolate between positions over 4.5 s linear |

Everything respects `prefers-reduced-motion`.

## 10. Accessibility rules baked into the system

- All text/background pairs meet 4.5:1, large text 3:1. Route badges meet 7:1.
- Focus ring is always visible, never removed.
- Status is conveyed by text plus tone square, never colour alone.
- Live regions: notices and ETA changes announced with `aria-live="polite"`, critical notices `assertive`.
- Map has a parallel list view for every map screen.
