# Product Brief: Athena Test A — UL Lafayette Transfer Advising Pilot

**Version:** 1.0
**Status:** Draft for Grant review; prototype build authorized
**Date:** 2026-07-29
**Product slug:** `athena-test-a`

## Executive summary

Athena Test A is a facilitated test of whether a radically simplified, student-centered view of academic position, next actions, deadlines, and blockers helps first-semester transfer students understand and complete the right advising action with less cognitive load.

The intended participant is a first-semester UL Lafayette transfer student with 30–60 accepted credits and at least one unresolved transfer-credit applicability question. This segment is the deepest-researched Athena route, but the segment choice and expected institutional value remain strategic inferences until tested with real participants and institutional stakeholders.

The first product is not a comprehensive advising platform and does not connect to Banner, DegreeWorks, ULink, TES, or Student Success Manager. It is a synthetic, facilitated testing environment with two connected experiences:

1. A tester flow comparing a fragmented baseline scenario with Athena’s simplified view.
2. A facilitator workspace that creates sessions, captures per-tester observations and seven-day follow-up, and aggregates the signals without inventing conclusions.

## Problem statement

Transfer students must synthesize information distributed across transcripts, transfer evaluations, degree audits, registration systems, emails, and advisor workflows. The research supports fragmentation and cognitive overload as meaningful sources of advising friction. It does not yet establish that Athena will improve action completion, reduce advisor time, improve retention, or produce institutional willingness to pay.

**Decision this test can change:** Whether Athena should continue toward a UL Lafayette transfer-advising pilot using the “My Position + My Next Three Moves + My Blockers” product shape.

## Research question

Does an Athena student path view improve clarity, correctness, and action completion for first-semester transfer students compared with navigating fragmented advising information alone?

## Product hypothesis

If an eligible transfer student receives a concise, advisor-verifiable view of their current position, next three actions, deadlines, and blockers, then they will identify the correct next action faster, with fewer information sources and greater confidence, without receiving an incorrect or unauthorized academic recommendation.

This is an **Inference** to test, not a verified capability.

## Target users

### Primary tester

- First-semester transfer student
- 30–60 accepted credits
- At least one unresolved equivalency or fallthrough credit
- Approaching the registration advising window

The source study proposed exclusions for student-athletes, fully online students, and adult learners over 25 to reduce confounding factors. Those criteria require institutional and research review before a real pilot.

### Facilitator

- Researcher, product team member, or approved institutional facilitator
- Creates a pseudonymous session
- Observes the baseline and Athena tasks
- Records corrections, incidents, notes, and follow-up outcomes
- Does not provide or approve academic advice through the software

### Advisor reviewer

An advisor or authorized staff member may verify whether proposed actions are correct. Advisor approval remains human-owned and is represented as facilitator-entered evidence in this prototype.

## Proposed value

### Student value

- Understand current academic position without reconstructing multiple systems
- Identify the next three relevant actions
- See deadlines and blockers before registration
- Arrive at advising with a focused, relevant question

### Advisor value

- Receive a prepared student status summary
- See what the student understood and where correction was needed
- Preserve professional judgment for applicability, substitutions, overrides, and exceptions

### Institutional value hypothesis

Potential signals include faster correct action completion, fewer avoidable corrections, more applicable registered credits, and better-prepared advising interactions. No institutional outcome or financial impact is currently verified.

## Test experience

### 1. Session setup

The facilitator:

- creates a pseudonymous participant code;
- confirms that synthetic data will be used;
- records only minimum cohort metadata;
- confirms consent/authorization appropriate to the test context;
- starts the baseline task.

### 2. Baseline task

The tester receives a synthetic, fragmented workspace representing common advising sources. The prompt is: **“What are your next three actions?”**

The prototype automatically records:

- elapsed time;
- information sources opened;
- source switches;
- selected actions;
- correctness against the pre-verified synthetic scenario;
- confidence rating.

### 3. Athena task

The tester receives four constrained panels:

1. My Position
2. My Next Three Moves
3. My Blockers
4. Question for My Advisor

The prototype records:

- elapsed time;
- comprehension answers;
- correctness;
- confidence;
- intended immediate action.

### 4. Facilitator review

The facilitator records:

- whether any proposed action required advisor correction;
- the number of corrections;
- any incorrect recommendation;
- any unauthorized action or access attempt;
- qualitative observation;
- participant withdrawal or invalid-session reason.

### 5. Seven-day follow-up

If the test progresses beyond synthetic usability work, the facilitator may record whether the participant completed one advisor-verified next action within seven days. This field is manual and must not be inferred from intent.

## Signals and measurements

| Signal | Definition | Collection | Evidence use |
| --- | --- | --- | --- |
| Correct action identified | Tester selects the verified first action | Automatic | Baseline vs. Athena comprehension |
| Next-three accuracy | Number of verified actions selected, 0–3 | Automatic | Correctness comparison |
| Time to answer | Seconds from task start to submission | Automatic | Speed comparison |
| Sources opened | Distinct baseline sources inspected | Automatic | Fragmentation behavior |
| Source switches | Movement between baseline sources | Automatic | Cognitive-load proxy |
| Confidence | Self-rating, 1–5 | Tester | Directional self-report only |
| Advisor corrections | Number of proposed actions requiring change | Facilitator | Reliability and preparation signal |
| Incorrect recommendation | Any Athena action judged incorrect | Facilitator | Guardrail; target is zero |
| Immediate action intent | Action the tester says they would take | Tester | Intent only, not completion |
| Verified action in seven days | One advisor-verified next action completed | Facilitator follow-up | Primary behavioral pilot outcome |
| Withdrawal/invalid session | Participant stops or protocol is compromised | Facilitator | Denominator and study quality |

The source package does not provide complete go/no-go thresholds. This product reports observed values and labels thresholds as **Unknown** until Grant and the approved research team set them before real participant recruitment.

## MVP scope

### Included

- Route A product brief and protocol
- Role selection for tester and facilitator
- Pseudonymous local session creation
- Synthetic baseline advising workspace
- Athena four-panel student view
- Automatic timer, source-open, source-switch, correctness, and confidence capture
- Facilitator observation and seven-day follow-up fields
- Per-tester session table
- Aggregate signal dashboard
- JSON and CSV export
- Local browser persistence
- Reset with explicit confirmation

### Excluded

- Real student names, IDs, grades, financial-aid details, disability records, or disciplinary data
- Authentication or multi-device synchronization
- Production database or cloud telemetry
- Banner, DegreeWorks, ULink, TES, SSM, Ellucian Ethos, or institutional API integration
- Automated registration, course selection, substitution, override, or hold removal
- Automated advisor approval
- Claims of FERPA, IRB, or institutional approval
- Randomized trial administration
- Retention, tuition, or ROI conclusions

## Data model

### Test session

- Session ID and pseudonymous participant code
- Eligibility confirmations
- Consent/authorization confirmation
- Status and timestamps
- Baseline response metrics
- Athena response metrics
- Facilitator review
- Seven-day follow-up
- Free-text research notes

### Aggregate dashboard

Every aggregate is calculated from stored sessions. Empty dashboards display **No measurements found**. Unknown follow-up is excluded from the verified-action denominator and shown separately.

## Functional requirements

1. Grant or a facilitator can click **Start Test A** from the research portal.
2. A visitor can choose **Facilitator workspace** or **Tester experience**.
3. A facilitator can create a session without entering direct identifiers.
4. A tester can complete the baseline and Athena tasks in a guided sequence.
5. The system records objective interaction data and clearly separates it from self-report and facilitator judgment.
6. A facilitator can open any participant record, add review/follow-up data, and see recalculated aggregates.
7. A facilitator can export a durable dataset before clearing browser storage.
8. The interface always labels the scenario as synthetic and never presents an academic action as institutionally approved.

## Non-functional requirements

- Works as a static GitHub Pages application with no external dependencies
- Responsive at 390px mobile and common desktop widths
- Keyboard-accessible primary flow
- No network transmission of session data
- No console errors in supported Chromium testing
- Stored data remains local to the current browser and origin

## Risks and mitigations

| Risk | Impact | Mitigation |
| --- | --- | --- |
| Synthetic behavior is mistaken for real demand | High | Label test mode and evidence class throughout |
| Static storage is mistaken for shared research infrastructure | High | Display local-only status; require export for handoff |
| Incorrect advice appears authoritative | High | Use pre-verified synthetic scenario and persistent advisor-review guardrails |
| Facilitator records identifiable data in notes | High | In-product warning and pseudonymous code requirement |
| Sample-size conflict in source reports (40 vs. 50) | Medium | Do not hard-code a decision threshold; show observed N |
| Go/no-go thresholds are absent from source | High | Display Unknown until defined before recruitment |
| Real institutional use begins without approval | High | Keep the prototype synthetic and state approval gates explicitly |

## Approval gates before a real UL Lafayette test

- Grant approves the product brief and learning decision
- Institutional sponsor and data steward approve the protocol
- Advisor reviewers verify all scenario/action logic
- Research/IRB determination is documented
- FERPA and consent handling are approved
- Data retention, access, export, and destruction procedures are approved
- Go/no-go thresholds and valid denominators are defined before recruitment

## Source traceability

- `athena_package/text/00_START_HERE_Athena_Customer_Discovery_Workspace.txt`
- `athena_package/text/01_Athena_Research_Journey_and_Decision_Trail.txt`
- `athena_package/text/02_Athena_Customer_and_GTM_Options.txt`
- `athena_package/text/03_Athena_Evidence_Register_and_Source_Guide.txt`
- `athena_package/05_Source_UL_Lafayette_Student_Advising_Validation.txt`

## Open decisions for Grant

1. Is Test A the first learning loop Athena should run?
2. Should the first live phase be a synthetic within-subject usability test or an approved behavioral pilot?
3. Who is authorized to verify action correctness?
4. What go, change, and stop thresholds must be fixed before recruitment?
5. What evidence would cause Athena to leave the institutional advising route?
