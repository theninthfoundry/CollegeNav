# Architecture & Design Decisions (docs/DECISIONS.md)

Record of decisions, conflicts resolved between specifications, and assumptions.

| Date | Topic | Decision | Rationale |
|---|---|---|---|
| 2026-10-14 | Initial Spec Alignment | Specs from 00 to 12 accepted as source of truth. When conflict arises, more specific wins (Data Model > PRD, API Spec > UI Wireframe). | As defined in AGENTS.md and master prompt. |
| 2026-10-14 | Timezone & Format | Asia/Kolkata everywhere. 12-hour (am/pm) for student UI, 24-hour in admin tables. | Adheres to docs/02 and docs/09. |
