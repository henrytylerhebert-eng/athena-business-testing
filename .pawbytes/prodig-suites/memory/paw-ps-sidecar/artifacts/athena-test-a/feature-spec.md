# Feature Specification: Athena Test A

## Value proposition

Athena Test A gives an eligible transfer-student tester a concise, human-reviewable path through a synthetic advising scenario while giving a facilitator trustworthy per-tester observations and aggregate signals needed to decide whether the Route A hypothesis deserves a real approved pilot.

## Feature priorities

| Feature | Priority | Reason |
| --- | --- | --- |
| Role gate | P0 | Separates tester and facilitator responsibilities |
| Pseudonymous session setup | P0 | Creates a minimum-data research record |
| Fragmented baseline task | P0 | Establishes comparison behavior |
| Athena four-panel task | P0 | Tests the core product shape |
| Automatic interaction capture | P0 | Produces objective timing and navigation signals |
| Facilitator review/follow-up | P0 | Captures corrections, guardrails, and verified action |
| Signal dashboard | P0 | Makes observed evidence legible |
| CSV/JSON export and JSON import | P1 | Enables durable handoff across local devices |
| Cloud synchronization | Excluded | Requires backend, authentication, and data governance |
| Institutional integrations | Excluded | Not required for the synthetic learning goal |

## P0 acceptance criteria

### Role gate

- Given the Test A entry page, a visitor can enter either facilitator or tester mode.
- The page states that records are local and the scenario is synthetic before either role proceeds.

### Session setup

- A facilitator can create a session using a pseudonymous code.
- The form rejects missing acknowledgements and credits outside 30–60.
- No direct student identifier is requested.

### Baseline task

- A tester can inspect four simulated sources.
- The system records distinct sources opened, source switches, elapsed seconds, three selected actions, correctness, and confidence.
- Submission requires exactly three actions.

### Athena task

- A tester sees Position, Next Three Moves, Blockers, and Advisor Question.
- The system records elapsed seconds, three comprehension answers, correctness, confidence, and intended action.

### Facilitator review

- A facilitator can record correction count, incorrect recommendation, unauthorized action, withdrawal/invalidity, notes, and seven-day follow-up.
- Unknown follow-up remains distinct from not completed.

### Dashboard

- With no records, metrics show `No measurements found`.
- With completed records, all aggregates derive from stored sessions.
- Guardrail incidents and unknown follow-ups remain visible.

### Portability

- Facilitator can export all sessions as JSON and CSV.
- Tester can export one record.
- Facilitator can import a valid Test A JSON export without silently duplicating a session ID.

## Dependency map

`Session setup → Baseline → Athena task → Facilitator review → Dashboard aggregates`

`Local persistence → Session resume + Export`

`Signal dictionary → Metrics calculations + CSV columns`
