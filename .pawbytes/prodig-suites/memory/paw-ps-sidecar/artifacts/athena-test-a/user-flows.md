# User Flows: Athena Test A

## Entry points

| Entry | User state | Trigger |
| --- | --- | --- |
| Research portal | Grant/facilitator | Clicks Start Test A |
| Test A role gate | New visitor | Opens `/test-a/` |
| Facilitator dashboard | Returning facilitator | Chooses facilitator role |
| Tester access | Tester | Chooses tester role or receives device/session code |

## Facilitator flow

`Role gate → Dashboard → New session → Eligibility/acknowledgement → Session created → Hand off device → Tester completes tasks → Review record → Follow-up → Export`

### Decision points

- Missing acknowledgement: remain in setup with a field error.
- Participant outside the research-defined cohort: do not start; return to dashboard.
- Session incomplete: dashboard labels it in progress and offers resume.
- Follow-up not yet known: retain `Unknown`; do not count as not completed.
- Guardrail incident: surface prominently; do not hide in aggregate averages.

## Tester flow

`Role gate → Enter/create pseudonymous session → Test orientation → Start baseline → Inspect sources → Select actions/confidence → Transition → Start Athena task → Answer comprehension/confidence/intent → Completion → Return to facilitator or export record`

### Error and recovery states

| Error | Message | Recovery |
| --- | --- | --- |
| Session code not found | No local session found | Create tester-only local record or return to facilitator |
| Fewer/more than three baseline actions | Select exactly three | Stay on task |
| Missing comprehension answer | Complete required answer | Stay on task |
| Browser reload | Session is saved locally | Resume current stage |
| Import schema mismatch | File is not a Test A export | Keep existing data unchanged |

## Key screens

| Screen | Purpose | Required data |
| --- | --- | --- |
| Role gate | Orient and select role | None |
| Facilitator dashboard | Monitor signals and sessions | Local session collection |
| Session setup | Create pseudonymous record | Cohort and acknowledgements |
| Baseline workspace | Observe fragmented navigation | Synthetic scenario |
| Athena path view | Test simplified comprehension | Same synthetic scenario |
| Completion | Close tester task safely | Session summary |
| Record review | Add judgment and follow-up | Selected session |
