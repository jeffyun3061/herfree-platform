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

## 2026-10-11 verification

The MFA/operations release patches Next.js to 16.3.8, sharp to 0.35.5 and the
Vitest worker override to tinypool 2.1.2. Browserslist/source-map dependency
patches are reflected in the lockfile. All 38 frontend tests, lint and the
production build pass with these versions (Node 20+ remains required).

The shipped dependency audit reports zero vulnerabilities. The complete audit
reports zero critical vulnerabilities and twelve development-only findings
(eight high, four moderate) in Vitest mock handling and the legacy ESLint/Tailwind
build tree. These findings remain outstanding; this verification is not a claim
that every dependency is fixed. CI retains its existing production-high and
all-dependencies-critical gates and read-only, secret-free pull-request jobs.
Track the remaining toolchain migration separately before the existing review
deadline; do not use audit --force to replace major UI/build dependencies silently.

Primary advisories: [Next.js](https://github.com/vercel/next.js/security/advisories/GHSA-vcvr-r3jv-pc5j),
[tinypool](https://github.com/tinylibs/tinypool/security/advisories/GHSA-5gmw-xhrv-c9v3).

## 2026-10-23 candidate verification

The preproduction candidate upgrades Next.js to 16.4.2 and Vitest to 4.1.12.
Vite is explicitly pinned to the patched 7.3.7 line to retain the existing
esbuild test configuration and Node 20 CI compatibility. Compatible transitive
patches are also recorded in the lockfile. No audit gate has been relaxed.

The production dependency audit reports zero vulnerabilities. The complete
audit reports zero critical, seven high and two moderate development-only
findings. Remaining roots are the unpatched `braces` parser used by the
ESLint/Tailwind glob tree and the older PostCSS selector parser used by Tailwind.
They process repository files during development/build, not user post content.
CI must stay read-only and without production secrets for pull requests.
These findings are still open; a tested lint/Tailwind migration remains due
by the existing 2026-10-29 review date. Do not force-install Tailwind 4 as an
unreviewed substitute during this privacy/UI release.

Patched upstream advisories:
[Next image optimization](https://github.com/vercel/next.js/security/advisories/GHSA-2464-fhr4-w9xw),
[Next cache components](https://github.com/vercel/next.js/security/advisories/GHSA-673q-mjm6-r5xr),
[Vitest manual mocks](https://github.com/vitest-dev/vitest/security/advisories/GHSA-qxg6-89mg-rqv8).

## 2026-10-24 final code review

The unchanged candidate lockfile now reports zero production findings and three
moderate development/build findings, with zero high or critical findings. The
three entries (`postcss-selector-parser`, `postcss-nested`, and `tailwindcss`)
represent one advisory, GHSA-rj75-hqrm-r3gf. This is an updated advisory database
result, not evidence that this review changed or patched seven dependencies.

The lockfile and `npm ls postcss-selector-parser --all` both resolve the parser
to **6.1.5**. The [maintainer's advisory](https://github.com/postcss/postcss-selector-parser/security/advisories/GHSA-rj75-hqrm-r3gf)
lists **6.1.5 and 7.1.6 as patched**, while npm's current advisory payload still
matches every version below 7.1.6. Record this discrepancy rather than claiming
that the complete npm audit is clean or forcing Tailwind 4 merely to remove the
warning. The parser is used on repository CSS at build time, not on user posts.
Recheck the registry advisory by 2026-10-29; existing audit gates stay enabled.

Candidate `cabf6d4` passed the full CI, 50 frontend unit tests and 96 browser
checks across Chromium, mobile Chromium and iPhone WebKit. The final PR commit
must also pass the current CI and CodeQL checks before staging validation.
