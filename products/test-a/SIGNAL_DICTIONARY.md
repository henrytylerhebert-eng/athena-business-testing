# Athena Test A signal dictionary

This dictionary separates automatically observed behavior, tester self-report, facilitator judgment, and follow-up evidence.

| Field | Type | Source | Valid values | Aggregate treatment |
| --- | --- | --- | --- | --- |
| `participantCode` | Identifier | Facilitator | Pseudonymous text | Never aggregated as a metric |
| `baseline.elapsedSeconds` | Observation | Automatic timer | Integer ≥ 0 | Mean/median across completed baselines |
| `baseline.sourcesOpened` | Observation | Automatic | 0–4 | Mean and distribution |
| `baseline.sourceSwitches` | Observation | Automatic | Integer ≥ 0 | Mean and baseline comparison |
| `baseline.correctCount` | Derived observation | Selected answers | 0–3 | Mean and accuracy rate |
| `baseline.firstActionCorrect` | Derived observation | Selected answers | true/false | Percentage |
| `baseline.confidence` | Self-report | Tester | 1–5 | Mean; labeled self-report |
| `athena.elapsedSeconds` | Observation | Automatic timer | Integer ≥ 0 | Mean/median across completed Athena tasks |
| `athena.correctCount` | Derived observation | Comprehension answers | 0–3 | Mean and accuracy rate |
| `athena.firstActionCorrect` | Derived observation | Comprehension answer | true/false | Percentage |
| `athena.confidence` | Self-report | Tester | 1–5 | Mean; labeled self-report |
| `athena.intendedAction` | Self-report | Tester | Fixed action list | Distribution; never completion |
| `review.advisorCorrectionCount` | Judgment | Facilitator/advisor | Integer ≥ 0 | Mean and count |
| `review.incorrectRecommendation` | Guardrail judgment | Facilitator/advisor | true/false/unknown | Count; unknown shown separately |
| `review.unauthorizedAction` | Guardrail judgment | Facilitator | true/false | Count |
| `review.withdrawn` | Protocol status | Facilitator | true/false | Removed from completed-test denominator |
| `followUp.status` | Follow-up evidence | Facilitator | verified/not-completed/unknown | Verified rate uses known follow-ups only |
| `followUp.actionType` | Follow-up evidence | Facilitator | Fixed list or other | Distribution |
| `followUp.daysToAction` | Follow-up evidence | Facilitator | 0–7 | Mean among verified actions |

## Derived dashboard signals

| Signal | Formula |
| --- | --- |
| Completed sessions | Sessions with both baseline and Athena submissions and not withdrawn |
| Accuracy lift | Mean Athena correct count − mean baseline correct count |
| Time change | Mean Athena seconds − mean baseline seconds |
| Time reduction percentage | `(baseline mean − Athena mean) / baseline mean × 100` when baseline mean > 0 |
| Confidence change | Mean Athena confidence − mean baseline confidence |
| Verified seven-day action rate | Verified / (verified + not-completed); unknown excluded and shown |
| Guardrail incident count | Incorrect recommendations marked true + unauthorized actions marked true |

No seeded or demonstration record may be presented as participant evidence.
