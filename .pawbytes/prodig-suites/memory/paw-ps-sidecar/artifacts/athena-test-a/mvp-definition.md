# MVP Definition: Athena Test A

## Learning goals

- **Primary:** Does the Athena view improve correct next-action identification compared with a fragmented synthetic baseline?
- **Secondary:** Does it reduce task time and information switching, increase confidence, and remain free of incorrect or unauthorized recommendations?
- **Behavioral follow-up:** Can an approved pilot later verify one advisor-reviewed action completed within seven days?

## Core feature set

The MVP includes one complete tester workflow, one facilitator workflow, local persistence, per-tester review, aggregate metrics, and data export/import.

## Explicit exclusions

- Production or cloud data
- Authentication and multi-user permissions
- Live institutional data
- Automated advising decisions
- Randomization engine
- Notifications
- Retention or ROI modeling

## Success metrics

The application measures accuracy, time, sources opened, source switches, confidence, corrections, guardrail incidents, and follow-up. Research-backed go/no-go thresholds are **Unknown** and must be fixed prospectively before real recruitment.

## Release criteria

- Portal links to Test A
- Both roles complete their core flows
- All stored metrics derive from actual local interactions
- Empty state shows no measurements
- CSV/JSON exports work
- Desktop and mobile have no blocking overflow
- Automated validation and browser checks pass
- GitHub Pages deployment succeeds
