# ADR-026: Do not expose public home population counters

- Status: Accepted
- Date: 2026-08-04

## Context

The public home endpoint previously returned the total number of accounts and
the number of consented members recording on the current day. Even without a
name or email address, small or changing populations can create an inference
signal for a health-oriented service.

## Decision

`GET /api/journal/public/home-stats` remains as a compatibility endpoint but
returns an empty object. It must not query the user table or journal records.
Public pages use generic copy and do not render participant counts.

Consent-filtered community insights remain a separate feature. They are
subject to the existing minimum-cohort and per-cell suppression policy and do
not return member identifiers, emails, IP addresses, or journal memos.

Authenticated administrator statistics are not public data and remain behind
the administrator access gate.

## Consequences

- Existing clients can continue calling the endpoint without receiving
  population-size data.
- The public endpoint is cheaper and faster because it performs no count query.
- Reintroducing a public count requires a new privacy review and a thresholded
  design; it is not a harmless UI-only change.

## Verification

- `JournalInsightServiceTest.publicHomeStatsDoNotExposeParticipantCounts`
- Frontend release smoke asserts the response data is `{}`.
