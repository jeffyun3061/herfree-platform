# ADR-025: Dependency audit scope

- Status: Accepted
- Date: 2026-07-29

## Context

The frontend dependency audit found no vulnerability in packages shipped by the
production application. It found one critical issue in Vitest 3.2.4 and high
severity denial-of-service advisories in the legacy ESLint 8 dependency tree.

Vitest has a compatible patch release. npm only proposes ESLint 10 as the fix
for the remaining advisories, while `eslint-config-next` 15 supports ESLint up
to version 9. Forcing ESLint 10 during a production security release would
replace the supported lint toolchain without framework compatibility evidence.

The affected ESLint packages run only in CI/development and are not installed
in the production runtime image. This does not make them harmless: malicious
repository content could still attack the CI runner.

## Decision

1. Upgrade Vitest to 3.2.6 or later and continue blocking every critical
   vulnerability, including development dependencies.
2. Block high and critical vulnerabilities in production dependencies with
   `npm audit --omit=dev --audit-level=high`.
3. Temporarily accept high-only findings in the ESLint 8 development tree.
4. Do not run ESLint on untrusted fork pull requests with write-capable tokens
   or production secrets. Current CI permissions remain `contents: read`.
5. Revisit ESLint 10 when the selected Next.js line declares compatibility.

## Rejected alternatives

- `npm audit fix --force`: it proposes unsupported major-version changes and
  may downgrade or replace framework lint configuration.
- Ignoring the full audit: critical development-tool vulnerabilities would no
  longer block CI.
- Blocking every development-only high finding: this currently makes all
  releases impossible without a framework/toolchain migration unrelated to the
  production privacy fix.

## Verification

- `npm audit --omit=dev --audit-level=high` must pass.
- `npm audit --audit-level=critical` must pass.
- `npm run lint`, `npm run test`, and `npm run build` must pass.
- Review this ADR when upgrading Next.js or no later than 2026-10-29.
