# Software Products Guidance

## Build pattern

Start with the value, user, and measurable learning decision. Define a small number of core workflows end-to-end, document error states, and exclude integrations that are not required for the first learning goal.

## Priority pattern

- P0: required for the core test
- P1: useful with a safe workaround
- P2: enhancement only
- Excluded: explicitly outside the first release

## Testability pattern

Every feature requires a user story, observable acceptance criteria, scope boundaries, and known dependencies. MVP metrics must connect directly to the primary hypothesis.

## Technical pattern

Choose the smallest stack consistent with the evidence and operational constraints. Build the differentiating workflow; defer authentication, cloud persistence, and production integrations until the test earns them.

## Athena-specific guardrails

- Human academic judgment remains human-owned.
- Local synthetic data precedes institutional data.
- A static prototype is not a shared research system.
- No measurement or approval is inferred from presentation quality.

**Last updated:** 2026-07-29
**Maintained by:** Software Executor
