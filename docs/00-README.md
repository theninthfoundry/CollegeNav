# CollegeNav: build pack

Intelligent college bus navigation for the Dejavu Hackathon, CampusSolve track (problem 05).

This folder is the complete specification. Read in order, build in the order given in `11-BUILD-PLAN-AND-DEMO.md`.

## What we are building

A mobile-first web app (installable PWA) with three surfaces on one codebase:

| Surface | Who | Job |
|---|---|---|
| Student app | Students, staff, parents | Find a bus, see stops and timings, get notified, track live where data exists |
| Admin console | Transport office | Maintain buses, routes, stops, schedules; publish notices; verify data |
| Driver mode | Drivers (or a transport staffer) | Start a trip and broadcast live location from a phone |

## The one idea that sets this apart

Most campus transport tools show a time and hope it is right. CollegeNav treats **honesty about data** as the product.

Every time, route and bus shown carries a quiet source label: **Live**, **Estimated**, **Scheduled**, or **Unavailable**, and every route carries a **freshness** state (Verified, Aging, Outdated, Unverified). This directly satisfies expected outcome 09 and makes outcomes 04, 05 and 07 trustworthy instead of decorative.

## Document map

| File | Contents |
|---|---|
| `01-PRD.md` | Problem, goals, personas, scope, requirements, success metrics, risks |
| `02-USER-FLOWS-AND-FEATURES.md` | Feature catalogue (P0/P1/P2) and step-by-step flows |
| `03-DESIGN-SYSTEM.md` | Principles, colour, type, spacing, tokens, components, map styling |
| `04-UI-SCREENS.md` | Every screen with layout wireframes and content rules |
| `05-UX-SPEC.md` | States, copy, accessibility, motion, offline behaviour |
| `06-ARCHITECTURE.md` | Stack, system diagram, modules, realtime, auth, security |
| `07-DATA-MODEL.md` | Full Postgres/PostGIS schema, enums, indexes, RLS, seed plan |
| `08-API-SPEC.md` | REST endpoints, payloads, errors, realtime channels |
| `09-CORE-LOGIC.md` | Route search, scoring, freshness, ETA, delay detection |
| `10-FOLDER-STRUCTURE.md` | Repository layout and module boundaries |
| `11-BUILD-PLAN-AND-DEMO.md` | Phased plan, outcome-to-feature map, demo script, judging notes |
| `12-BUILD-PROMPTS.md` | Ordered prompts for an AI coding agent |
| `AGENTS.md` | Drop into the repo root; conventions for any coding agent |

## Outcome coverage at a glance

| # | Expected outcome | Where it lives |
|---|---|---|
| 01 | Digital records of buses, routes, stops, schedules | Admin console, `07-DATA-MODEL.md` |
| 02 | Search by start and destination | Plan screen, `GET /plan` |
| 03 | Stops, route sequences, schedules | Route detail, Stop detail |
| 04 | Suggest suitable routes | Ranking in `09-CORE-LOGIC.md` |
| 05 | Notify on changes, delays, disruptions | Notices, push, in-app banners |
| 06 | Admins update information | Admin console with audit log |
| 07 | Optional live tracking and arrival estimates | Driver mode, live map, ETA engine |
| 08 | Mobile-friendly interface | Mobile-first design, PWA |
| 09 | Identify unavailable or outdated info | Freshness and source labels everywhere |

## Decisions already made (so you do not have to)

- **Stack:** Next.js (App Router) + TypeScript + Tailwind + Supabase (Postgres, PostGIS, Auth, Realtime) + MapLibre GL.
- **Map tiles:** OpenFreeMap Positron style. Free, no API key, light and minimal.
- **Live data source:** Driver mode in the browser (Geolocation API). A simulator replays a route for demos.
- **Language:** English first. Strings live in one file so Telugu and Hindi can be added later.
- **Design:** White surface, black type, one deep sapphire accent, eight deep route colours, no decorative icons.
