export const SESSION_SCHEMA = "athena-test-a-session.v1";
export const EXPORT_SCHEMA = "athena-test-a-export.v1";

export function isSessionComplete(session) {
  return Boolean(
    session?.baseline?.completedAt &&
    session?.athena?.completedAt &&
    !session?.review?.withdrawn &&
    !session?.review?.invalidReason
  );
}

function numeric(values) {
  return values.filter(value => Number.isFinite(value));
}

export function mean(values) {
  const clean = numeric(values);
  if (!clean.length) return null;
  return clean.reduce((sum, value) => sum + value, 0) / clean.length;
}

export function round(value, places = 1) {
  if (!Number.isFinite(value)) return null;
  const factor = 10 ** places;
  return Math.round(value * factor) / factor;
}

export function computeMetrics(sessions = []) {
  const completed = sessions.filter(isSessionComplete);
  const invalid = sessions.filter(session => session?.review?.withdrawn || session?.review?.invalidReason);
  const inProgress = sessions.filter(session => !isSessionComplete(session) && !invalid.includes(session));

  const baselineAccuracy = mean(completed.map(session => session.baseline.correctCount));
  const athenaAccuracy = mean(completed.map(session => session.athena.correctCount));
  const baselineTime = mean(completed.map(session => session.baseline.elapsedSeconds));
  const athenaTime = mean(completed.map(session => session.athena.elapsedSeconds));
  const baselineConfidence = mean(completed.map(session => session.baseline.confidence));
  const athenaConfidence = mean(completed.map(session => session.athena.confidence));

  const knownFollowUps = completed.filter(session =>
    ["verified", "not-completed"].includes(session?.followUp?.status)
  );
  const verifiedFollowUps = knownFollowUps.filter(session => session.followUp.status === "verified");

  const incorrectRecommendations = completed.filter(
    session => session?.review?.incorrectRecommendation === "yes"
  ).length;
  const unknownRecommendations = completed.filter(
    session => !session?.review?.incorrectRecommendation ||
      session.review.incorrectRecommendation === "unknown"
  ).length;
  const unauthorizedActions = completed.filter(session => session?.review?.unauthorizedAction).length;

  return {
    totalSessions: sessions.length,
    completedSessions: completed.length,
    inProgressSessions: inProgress.length,
    invalidSessions: invalid.length,
    baselineAccuracy: round(baselineAccuracy),
    athenaAccuracy: round(athenaAccuracy),
    accuracyLift: baselineAccuracy === null || athenaAccuracy === null
      ? null
      : round(athenaAccuracy - baselineAccuracy),
    baselineFirstActionRate: completed.length
      ? round(completed.filter(session => session.baseline.firstActionCorrect).length / completed.length * 100)
      : null,
    athenaFirstActionRate: completed.length
      ? round(completed.filter(session => session.athena.firstActionCorrect).length / completed.length * 100)
      : null,
    baselineTime: round(baselineTime),
    athenaTime: round(athenaTime),
    timeReductionPercent: baselineTime && athenaTime !== null
      ? round((baselineTime - athenaTime) / baselineTime * 100)
      : null,
    averageSourcesOpened: round(mean(completed.map(session => session.baseline.sourcesOpened?.length))),
    averageSourceSwitches: round(mean(completed.map(session => session.baseline.sourceSwitches))),
    baselineConfidence: round(baselineConfidence),
    athenaConfidence: round(athenaConfidence),
    confidenceChange: baselineConfidence === null || athenaConfidence === null
      ? null
      : round(athenaConfidence - baselineConfidence),
    totalAdvisorCorrections: numeric(completed.map(session => session?.review?.advisorCorrectionCount))
      .reduce((sum, value) => sum + value, 0),
    incorrectRecommendations,
    unknownRecommendations,
    unauthorizedActions,
    guardrailIncidents: incorrectRecommendations + unauthorizedActions,
    followUpKnown: knownFollowUps.length,
    followUpUnknown: completed.length - knownFollowUps.length,
    verifiedActions: verifiedFollowUps.length,
    verifiedActionRate: knownFollowUps.length
      ? round(verifiedFollowUps.length / knownFollowUps.length * 100)
      : null,
    averageDaysToAction: round(mean(verifiedFollowUps.map(session => session?.followUp?.daysToAction)))
  };
}

function csvCell(value) {
  const text = value === null || value === undefined ? "" : String(value);
  return `"${text.replaceAll('"', '""')}"`;
}

export function sessionsToCsv(sessions = []) {
  const fields = [
    ["session_id", session => session.id],
    ["participant_code", session => session.participantCode],
    ["status", session => session.status],
    ["created_at", session => session.createdAt],
    ["accepted_credits", session => session.eligibility?.acceptedCredits],
    ["baseline_seconds", session => session.baseline?.elapsedSeconds],
    ["baseline_sources_opened", session => session.baseline?.sourcesOpened?.length],
    ["baseline_source_switches", session => session.baseline?.sourceSwitches],
    ["baseline_correct_0_3", session => session.baseline?.correctCount],
    ["baseline_first_action_correct", session => session.baseline?.firstActionCorrect],
    ["baseline_confidence_1_5", session => session.baseline?.confidence],
    ["athena_seconds", session => session.athena?.elapsedSeconds],
    ["athena_correct_0_3", session => session.athena?.correctCount],
    ["athena_first_action_correct", session => session.athena?.firstActionCorrect],
    ["athena_confidence_1_5", session => session.athena?.confidence],
    ["intended_action", session => session.athena?.intendedAction],
    ["advisor_corrections", session => session.review?.advisorCorrectionCount],
    ["incorrect_recommendation", session => session.review?.incorrectRecommendation],
    ["unauthorized_action", session => session.review?.unauthorizedAction],
    ["withdrawn", session => session.review?.withdrawn],
    ["invalid_reason", session => session.review?.invalidReason],
    ["follow_up_status", session => session.followUp?.status],
    ["follow_up_action", session => session.followUp?.actionType],
    ["days_to_action", session => session.followUp?.daysToAction],
    ["facilitator_notes", session => session.review?.notes],
    ["follow_up_notes", session => session.followUp?.notes]
  ];

  const header = fields.map(([name]) => csvCell(name)).join(",");
  const rows = sessions.map(session =>
    fields.map(([, getter]) => csvCell(getter(session))).join(",")
  );
  return [header, ...rows].join("\n");
}

export function validateImportedSession(session) {
  if (!session || session.schema !== SESSION_SCHEMA) return false;
  if (typeof session.id !== "string" || typeof session.participantCode !== "string") return false;
  if (!session.eligibility || !session.baseline || !session.athena || !session.review || !session.followUp) return false;
  return true;
}
