# ADR-025: Frontend feature boundaries and thin Next BFF

## Status

Accepted

## Context

Herfree's React UI had the right building blocks, but larger pages were still
combining API calls, server state, permission decisions, and presentation. The
global header also had multiple rendering paths, which made responsive changes
easy to apply inconsistently. The Next.js route handler additionally contained
proxy, session, CSRF, body-limit, and header-filter responsibilities in one file.

## Decision

- New UI work is organized by feature (`features/journal`, `features/community`,
  `features/admin`, and `features/auth`).
- Routes compose a feature container; they do not call `fetch` or implement
  feature policy.
- Shared UI stays framework-neutral and feature-agnostic. A shared component is
  introduced only after two real consumers need the same behavior.
- `useApiQuery` and `useAsyncMutation` remain the low-level server-state
  primitives. Feature hooks own refetch, authorization-aware UI, and navigation.
- `AppHeader` owns responsive shell markup. `PageHeader` only declares a
  `HeaderSpec`, preventing duplicate desktop/mobile top bars.
- Next.js remains a thin BFF for HttpOnly session cookies, CSRF/origin checks,
  request limits, header filtering, and proxying. Domain rules remain in Spring.
- `check:architecture` runs before production builds and enforces the basic
  dependency direction automatically.

## Consequences

The page layer becomes easier to scan and feature changes are localized. New
features can be added without teaching shared UI about feature-specific states.
The repository contains a small amount of adapter code while existing API
modules are migrated, but this preserves behavior and reduces production risk.
More aggressive state-library or workspace-package adoption is intentionally
deferred until real requirements justify it.

## Verification

The boundary is checked by `npm run check:architecture`, `npm run lint`,
`npm test`, and `npm run build`. Responsive behavior is verified through the
release smoke and staging Playwright suites before production deployment.
