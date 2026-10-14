# AGENTS.md

CollegeNav: college bus navigation PWA (student app, admin console, driver mode). Specs are in `docs/`. Read the relevant doc before changing a feature.

## Commands

```
pnpm dev            # local server
pnpm typecheck      # tsc --noEmit
pnpm test           # vitest (domain logic)
pnpm test:e2e       # playwright
pnpm lint
pnpm db:migrate     # supabase db push
pnpm db:seed        # idempotent demo data
pnpm sim            # simulated bus on R1
```

Before finishing any task: `pnpm typecheck && pnpm lint && pnpm test` must pass.

## Architecture rules

- `src/domain/` is pure TypeScript: no database, framework, or network imports. Every function has a Vitest test.
- `src/server/repositories/` fetch and write rows only. Business logic lives in `domain/` or `server/services/`.
- Route handlers: validate with Zod, call one service, return JSON. Nothing else.
- Components never import from `src/server/`. They use `lib/api.ts` and TanStack Query.
- Every admin mutation writes to `audit_log` in the same transaction.
- Times are Asia/Kolkata. Never parse bare time strings with `new Date`.
- Student location is never stored or logged.

## Design rules (docs/03-DESIGN-SYSTEM.md)

- White surface, black text. One accent (sapphire). Route colours only on route badges, lines and markers.
- Use CSS variables and Tailwind token classes. No raw hex values in components.
- Radii: 6 (badges, tags), 8 (controls), 12 (panels), 20 top (sheets). Hairline borders instead of shadows. Shadow only on floating elements.
- Sentence case. No ALL CAPS labels. No arrows in button text. No emoji. No decorative icons. Icons from the allowed Lucide list only.
- Every time shown has a source label (Live, Estimated, Scheduled). Every route shows a freshness tag.
- Status is never colour alone: tone square plus text.
- Numerals use `tabular-nums`.
- Targets at least 44 px. Text at least 12 px. Focus ring always visible.

## Copy rules

- Strings live in `src/copy/en.ts`.
- Plain, short, active voice. Errors explain what happened and what to do, with no apology.
- A button and its resulting toast use the same verb ("Publish", "Published").

## Conventions

- TypeScript strict. No `any`. Prefer `unknown` plus Zod parsing at boundaries.
- Files kebab-case, components PascalCase, hooks `useX`.
- DB and API JSON are snake_case. Map to camelCase in repositories and `lib/api.ts`.
- Enums match `docs/07-DATA-MODEL.md` exactly (`to_campus`, `from_campus`, `run_status`, and so on).
- Do not add dependencies beyond the list in `docs/10-FOLDER-STRUCTURE.md` without a reason in the PR description.
- Keep components under about 200 lines. Extract when they grow.

## Do not

- Do not invent endpoints or fields. If something is missing from the spec, add it to the doc first.
- Do not hide cancelled trips, outdated routes, or suspended routes. Show them with their state.
- Do not mark an outdated route as "Best option".
- Do not call a prediction "Live". The position is live, the ETA is Estimated.
- Do not store driver positions beyond 7 days.

## Definition of done

Works at 360 px and 1280 px; has loading, empty, error and offline states; keyboard operable; strings in copy file; tests for domain changes; audit entry for admin writes.
