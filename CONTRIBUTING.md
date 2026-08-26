# Contributing to Merkato

Thanks for helping build Merkato! This document covers everything you need
to ship a clean pull request.

## Getting set up

1. **Install prerequisites** — Node.js ≥ 18.18, npm ≥ 9.
2. **Install dependencies**
   ```bash
   npm install
   ```
3. **Configure the environment**
   ```bash
   cp .env.local.example .env.local
   ```
   Fill in `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
   Everything else is optional — features degrade gracefully without keys.
4. **Provision the database** — follow [`SETUP_GUIDE.md`](SETUP_GUIDE.md)
   (run migrations in numeric order; create the private `documents` bucket).
5. **Run it**
   ```bash
   npm run dev
   ```

## Before you open a PR

All four checks must pass locally — CI runs exactly these:

```bash
npm run lint          # eslint (next/core-web-vitals)
npx tsc --noEmit      # typecheck
npm test              # vitest unit tests
npm run build         # hermetic production build (no secrets needed)
```

## Project conventions

### Architecture rules

- **Data access**: fetch in Server Components with typed Supabase queries;
  mutate exclusively through `"use server"` actions in the module's own
  `actions.ts`. Never query from client components except via Realtime or
  auth.
- **Security model**: RLS in Postgres is the real enforcement layer. App-side
  guards (`requireOrgContext` / `requireStaffContext`) are UX routing, not
  security. New tables MUST have organization-scoped RLS policies.
- **Cross-cutting helpers**: use `logActivity()`, `notify()`, and
  `auditLog()` — they are fire-and-forget by design and must never throw.

### Code style

- TypeScript strict mode; no `any` in new code. Prefer types generated into
  `types/database.generated.ts` over hand-written row shapes.
- No new runtime dependencies without prior discussion — Merkato deliberately
  hand-rolls markdown rendering, charts, and its design system. Open an issue
  first if you believe a library is justified.
- Comments explain *why*, not *what*. Match the existing voice.
- Dark-mode-first Tailwind tokens only (`bg-surface`, `text-muted`, …) — no
  raw hex values outside `tailwind.config.ts` / `globals.css`.

### Database changes

1. Add a new numbered migration file in `supabase/migrations/`
   (`012_your_change.sql`). Never edit an applied migration.
2. Use `create table if not exists` / idempotent guards so re-runs are safe.
3. Add RLS policies in the same migration.
4. Regenerate types and commit them together:
   ```bash
   SUPABASE_ACCESS_TOKEN=<token> npx supabase gen types typescript \
     --project-id <ref> --schema public > types/database.generated.ts
   ```
5. Update [`README.md`](README.md) (table list / counts) if the schema shape
   changes.

### Commits & PRs

- Commit style: short imperative subject (`Add rate limit to AI route`),
  details in the body when useful.
- Keep PRs focused on one change; include screenshots for UI work
  (`docs/screenshots/`).
- Describe *how to verify* the change in the PR description.

## Reporting bugs

Open an issue with: what you did, what you expected, what happened, and your
environment (OS, Node version). Include console/network errors where relevant
— but **never paste secrets or service-role keys**.

## License

By contributing, you agree that your contributions are licensed under the
[MIT License](LICENSE).
