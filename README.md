# Athena Business Testing

Athena is exploring a student-centered decision-clarity product for higher education. This repository turns the current research package into a testable business-learning system while preserving the distinction between sourced evidence, strategic inference, and unverified demand.

## Live research portal

**GitHub Pages:** <https://henrytylerhebert-eng.github.io/athena-business-testing/>

The portal combines the current readout, decision trail, four customer paths, smallest useful test, evidence register, source library, and a locally saved founder decision brief.

## Current business question

Which first learning loop best preserves Athena's student-empowerment thesis while producing credible evidence quickly?

The four current paths are:

1. UL Lafayette transfer advising pilot
2. Community-college pathway bridge
3. University recruiter field tool
4. Direct-to-student decision-clarity prototype

These are hypotheses to compare, not settled market decisions.

## Repository map

| Path | Purpose |
| --- | --- |
| `index.html` | Standalone Athena research and decision portal |
| `athena_package/` | Canonical research package and original source reports |
| `experiments/` | Business-test ledger and reusable experiment template |
| `decisions/` | Durable founder-decision template |
| `evidence/` | Evidence-handling rules |
| `scripts/validate-site.mjs` | Dependency-free static-site and package validation |
| `.github/workflows/pages.yml` | Validation and GitHub Pages deployment |

## Evidence boundary

The package supports the existence of fragmented advising systems, cognitive load, unclear next actions, and reactive blockers. It does **not** yet verify:

- direct demand from students, recruiters, advisors, community colleges, or institutional buyers;
- willingness to pay or a confirmed budget owner;
- production data access, integration approval, or extract availability;
- measured advisor time savings, student action rates, retention impact, or tuition preservation.

Do not convert a strategic inference into a public claim without adding inspectable source or test evidence.

## Work locally

No dependencies are required.

```bash
npm test
python3 -m http.server 4173
```

Then open <http://localhost:4173/>.

## Run a business test

1. Copy `experiments/TEMPLATE.md` into a new dated experiment file.
2. Define the decision the test can change.
3. Record the current evidence class for every premise.
4. Set continue, change, and stop criteria before recruiting participants.
5. Link raw observations and summarize only what the evidence supports.
6. Record the resulting decision in `decisions/`.

The portal is a presentation and working layer. The research package and captured test evidence are the durable record.
