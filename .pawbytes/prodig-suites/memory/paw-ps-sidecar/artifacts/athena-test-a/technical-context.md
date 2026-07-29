# Technical Context: Athena Test A

## Stack

- **Frontend:** Semantic HTML, CSS, native JavaScript ES modules
- **State:** In-memory state synchronized to `localStorage`
- **Data exchange:** JSON import/export and CSV export
- **Hosting:** GitHub Pages
- **CI/CD:** Existing GitHub Actions Pages workflow

This stack preserves the repository's dependency-free constraint and keeps synthetic records on the active device.

## Core data model

`TestSession` owns one baseline observation, one Athena observation, one facilitator review, and one follow-up. Aggregate metrics are calculated at render time and are never stored as independent evidence.

## Technical decisions

### Local-only persistence

Chosen over a hosted database because this build has no approved data-governance, authentication, or institutional environment. Implication: cross-device testing requires explicit export/import.

### Fixed synthetic scenario

Chosen to ensure the answer key is deterministic and does not represent live academic advice.

### No seeded dashboard data

Chosen to prevent demonstration values from being mistaken for measurements.

## Risks

| Risk | Mitigation |
| --- | --- |
| Browser storage cleared | Export JSON after sessions |
| Same-origin data visible to anyone using the browser profile | Use pseudonymous records and shared-device procedures |
| Cross-device record fragmentation | Import participant JSON into facilitator device |
| Static prototype mistaken for secure research system | Persistent local-only warning |
| Metric regression | Pure metric functions and fixture-based Node tests |

## Future integration boundary

No API contract is defined for production. A later approved system would require authenticated roles, server-side validation, encrypted storage, audit logging, retention/destruction policy, and institution-approved data contracts.
