# PRD-Lite: Athena Test A

**Version:** 1.0
**Status:** Build-ready
**Last updated:** 2026-07-29
**Owner:** Grant Dozier / Athena

## Product summary

Athena Test A is a static, facilitated research application that compares a fragmented advising baseline with a simplified Athena path view and captures inspectable per-tester signals.

## Target users

- Eligible transfer-student tester using a synthetic scenario
- Facilitator managing sessions, observations, and follow-up
- Advisor reviewer represented through facilitator-entered verification

## MVP requirements

1. Route and role selection
2. Pseudonymous session setup
3. Timed baseline navigation task
4. Timed Athena comprehension task
5. Local session persistence
6. Participant-level facilitator review
7. Aggregate signal dashboard
8. JSON/CSV export and JSON import

## Technical context

- Static HTML/CSS/ES modules
- Browser `localStorage`
- GitHub Pages hosting
- No backend, authentication, database, or institutional integration

## Data entities

- `TestSession`
- `BaselineObservation`
- `AthenaObservation`
- `FacilitatorReview`
- `FollowUp`

## Release quality

- Keyboard-accessible controls
- Clear synthetic/local-only labeling
- Zero seeded evidence
- No direct identifiers requested
- Validation and browser interaction tests pass

## Risks

Local storage is not a shared or approved research database. Synthetic results cannot establish institutional demand or real-world action completion. Any real test requires the approval gates in the product brief.
