import {
  EXPORT_SCHEMA,
  SESSION_SCHEMA,
  computeMetrics,
  isSessionComplete,
  sessionsToCsv,
  validateImportedSession
} from "./metrics.mjs";

const app = document.getElementById("app");
const toast = document.getElementById("toast");
const STORAGE_KEY = "athena.test-a.sessions.v1";
const CORRECT_ACTIONS = new Set(["schedule-advising", "submit-substitution", "review-curriculum"]);
const ACTIONS = [
  ["schedule-advising", "Schedule the mandatory advising appointment"],
  ["submit-substitution", "Ask about a course substitution for ELEC 1xx"],
  ["review-curriculum", "Review the Mechanical Engineering sophomore curriculum"],
  ["register-now", "Register immediately before the advising hold is removed"],
  ["retake-credits", "Retake all 15 credits that are not currently applied"],
  ["contact-financial-aid", "Contact Financial Aid to approve the transfer equivalency"]
];
const SOURCE_IDS = ["ulink", "degreeworks", "transfer", "advisor"];
const scenario = {
  major: "Mechanical Engineering",
  acceptedCredits: 60,
  appliedCredits: 45,
  fallthroughCredits: 6,
  hold: "Advising hold (AD)",
  timeTicket: "April 2 at 8:00 AM",
  advisor: "Dr. Smith"
};

let sessions = loadSessions();
let timerHandle = null;
let toastHandle = null;

function loadSessions() {
  try {
    const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
    return Array.isArray(parsed) ? parsed.filter(validateImportedSession) : [];
  } catch {
    return [];
  }
}

function persist() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(sessions));
    return true;
  } catch {
    showToast("Browser storage is unavailable. Export before leaving.");
    return false;
  }
}

function escapeHtml(value = "") {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function nowIso() {
  return new Date().toISOString();
}

function makeId() {
  if (crypto.randomUUID) return crypto.randomUUID();
  return `athena-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function createSession(values) {
  const timestamp = nowIso();
  return {
    schema: SESSION_SCHEMA,
    id: makeId(),
    participantCode: values.participantCode.trim().toUpperCase(),
    createdAt: timestamp,
    updatedAt: timestamp,
    status: "orientation",
    eligibility: {
      firstSemester: true,
      acceptedCredits: Number(values.acceptedCredits),
      unresolvedEquivalency: true,
      syntheticAcknowledged: true,
      consentAcknowledged: true,
      createdBy: values.createdBy
    },
    baseline: {
      startedAt: null,
      completedAt: null,
      elapsedSeconds: null,
      sourcesOpened: [],
      sourceSwitches: 0,
      lastSource: null,
      activeSource: "ulink",
      selectedActions: [],
      firstAction: null,
      firstActionCorrect: null,
      correctCount: null,
      confidence: null
    },
    athena: {
      startedAt: null,
      completedAt: null,
      elapsedSeconds: null,
      answers: {},
      firstActionCorrect: null,
      correctCount: null,
      confidence: null,
      intendedAction: null
    },
    review: {
      advisorCorrectionCount: null,
      incorrectRecommendation: "unknown",
      unauthorizedAction: false,
      withdrawn: false,
      invalidReason: "",
      notes: ""
    },
    followUp: {
      status: "unknown",
      actionType: "",
      daysToAction: null,
      notes: ""
    }
  };
}

function getSession(id) {
  return sessions.find(session => session.id === id);
}

function updateSession(id, mutate) {
  const session = getSession(id);
  if (!session) return null;
  mutate(session);
  session.updatedAt = nowIso();
  persist();
  return session;
}

function routeParts() {
  return (location.hash.replace(/^#\/?/, "") || "choose").split("/").filter(Boolean);
}

function navigate(route) {
  if (location.hash === route) {
    render(true);
  } else {
    location.hash = route;
  }
}

function showToast(message) {
  toast.textContent = message;
  toast.classList.add("show");
  clearTimeout(toastHandle);
  toastHandle = setTimeout(() => toast.classList.remove("show"), 2600);
}

function clearTimer() {
  if (timerHandle) clearInterval(timerHandle);
  timerHandle = null;
}

function startVisibleTimer(startedAt) {
  clearTimer();
  const target = document.getElementById("timer");
  if (!target || !startedAt) return;
  const update = () => {
    const seconds = Math.max(0, Math.floor((Date.now() - new Date(startedAt).getTime()) / 1000));
    target.textContent = formatDuration(seconds);
  };
  update();
  timerHandle = setInterval(update, 1000);
}

function formatDuration(seconds) {
  if (!Number.isFinite(seconds)) return "—";
  const minutes = Math.floor(seconds / 60);
  const remainder = Math.floor(seconds % 60);
  return `${String(minutes).padStart(2, "0")}:${String(remainder).padStart(2, "0")}`;
}

function formatDate(value) {
  if (!value) return "Unknown";
  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit"
  }).format(new Date(value));
}

function sessionStatus(session) {
  if (session.review?.withdrawn || session.review?.invalidReason) return ["Invalid / withdrawn", "invalid"];
  if (isSessionComplete(session)) return ["Tasks complete", "complete"];
  return ["In progress", "progress"];
}

function statusMarkup(session) {
  const [label, className] = sessionStatus(session);
  return `<span class="status ${className}">${label}</span>`;
}

function metricMarkup(label, value, detail, className = "") {
  const empty = value === null || value === undefined;
  return `
    <div class="metric ${className}">
      <span class="metric-label">${label}</span>
      <strong class="metric-value ${empty ? "empty" : ""}">${empty ? "No measurements found" : value}</strong>
      <small>${detail}</small>
    </div>`;
}

function roleGate() {
  return `
    <section class="gate">
      <div class="gate-inner">
        <div>
          <p class="kicker">Route A · Facilitated product test</p>
          <h1>Can clarity change the <em>next action?</em></h1>
          <p class="gate-lead">Compare a fragmented transfer-advising task with Athena’s position, next moves, and blockers view—then inspect the signals per tester.</p>
          <div class="gate-boundary">
            <span>!</span>
            <div><b>Synthetic test environment.</b> No live UL Lafayette data, academic decisions, or institutional approval are represented here. All records stay in this browser unless exported.</div>
          </div>
        </div>
        <aside class="role-panel">
          <h2>Choose your role</h2>
          <p>The two experiences write to the same local session record.</p>
          <button class="role-option" type="button" data-route="#/facilitator">
            <span><b>Facilitator workspace</b><i>→</i></span>
            <small>Create participant sessions, hand off the test, review individual records, capture follow-up, and monitor aggregate signals.</small>
          </button>
          <button class="role-option" type="button" data-route="#/tester">
            <span><b>Tester experience</b><i>→</i></span>
            <small>Join or create a pseudonymous session, complete both timed tasks, and export the record if testing on another device.</small>
          </button>
          <div class="role-note"><b>Local-only</b><span>Cross-device records require an explicit JSON export and facilitator import.</span></div>
        </aside>
      </div>
    </section>`;
}

function facilitatorDashboard() {
  const metrics = computeMetrics(sessions);
  const accuracyValue = metrics.accuracyLift === null
    ? null
    : `${metrics.accuracyLift > 0 ? "+" : ""}${metrics.accuracyLift} / 3`;
  const timeValue = metrics.timeReductionPercent === null
    ? null
    : `${Math.abs(metrics.timeReductionPercent)}% ${metrics.timeReductionPercent >= 0 ? "faster" : "slower"}`;
  const followUpValue = metrics.verifiedActionRate === null ? null : `${metrics.verifiedActionRate}%`;
  const guardrailValue = metrics.completedSessions ? String(metrics.guardrailIncidents) : null;

  const accuracyBaselineWidth = metrics.baselineAccuracy === null ? 0 : metrics.baselineAccuracy / 3 * 100;
  const accuracyAthenaWidth = metrics.athenaAccuracy === null ? 0 : metrics.athenaAccuracy / 3 * 100;
  const timeMax = Math.max(metrics.baselineTime || 0, metrics.athenaTime || 0, 1);
  const baselineTimeWidth = metrics.baselineTime === null ? 0 : metrics.baselineTime / timeMax * 100;
  const athenaTimeWidth = metrics.athenaTime === null ? 0 : metrics.athenaTime / timeMax * 100;
  const confidenceBaselineWidth = metrics.baselineConfidence === null ? 0 : metrics.baselineConfidence / 5 * 100;
  const confidenceAthenaWidth = metrics.athenaConfidence === null ? 0 : metrics.athenaConfidence / 5 * 100;

  return `
    <section class="workspace">
      <header class="workspace-head">
        <div>
          <p class="kicker">Facilitator workspace</p>
          <h1>Test A signals</h1>
          <p>Observed interactions, tester self-report, facilitator judgment, and follow-up remain visibly separate.</p>
        </div>
        <div class="head-actions">
          <button class="button secondary" type="button" data-action="export-csv">Export CSV</button>
          <button class="button secondary" type="button" data-action="export-json">Export JSON</button>
          <label class="button secondary" for="import-file">Import JSON</label>
          <input id="import-file" type="file" accept="application/json,.json" hidden>
          <button class="button" type="button" data-route="#/facilitator/new">Start new test</button>
        </div>
      </header>

      <div class="boundary-banner">
        <span class="icon">!</span>
        <div><strong>Threshold status: Unknown.</strong> The source package does not contain complete go/no-go thresholds. This dashboard measures observed signals and does not label the test passed or failed.</div>
      </div>

      <div class="metrics-strip">
        ${metricMarkup("Completed sessions", metrics.completedSessions, `${metrics.inProgressSessions} in progress · ${metrics.invalidSessions} invalid`)}
        ${metricMarkup("Accuracy lift", accuracyValue, "Athena mean minus baseline mean", metrics.accuracyLift > 0 ? "good" : "")}
        ${metricMarkup("Time change", timeValue, "Mean task time comparison", metrics.timeReductionPercent > 0 ? "good" : "")}
        ${metricMarkup("Verified action ≤7 days", followUpValue, `${metrics.followUpKnown} known · ${metrics.followUpUnknown} unknown`)}
        ${metricMarkup("Guardrail incidents", guardrailValue, `${metrics.unknownRecommendations} recommendation reviews unknown`, metrics.guardrailIncidents ? "alert" : "")}
      </div>

      <div class="dashboard-grid">
        <article class="surface">
          <div class="surface-head">
            <div><h2>Baseline vs. Athena</h2><p>Only sessions with both tasks complete are included.</p></div>
            <span class="status ${metrics.completedSessions ? "complete" : ""}">${metrics.completedSessions || "No"} complete</span>
          </div>
          <div class="surface-body">
            <div class="comparison-row">
              <div class="comparison-label"><b>Next-three accuracy</b><small>0–3 correct</small></div>
              <div class="bar-pair">
                <div class="bar-track"><div class="bar-fill" style="--width:${accuracyBaselineWidth}%"></div></div>
                <div class="bar-track"><div class="bar-fill athena" style="--width:${accuracyAthenaWidth}%"></div></div>
              </div>
              <div class="comparison-number">${metrics.baselineAccuracy ?? "—"} → ${metrics.athenaAccuracy ?? "—"}</div>
            </div>
            <div class="comparison-row">
              <div class="comparison-label"><b>Task time</b><small>Mean seconds</small></div>
              <div class="bar-pair">
                <div class="bar-track"><div class="bar-fill" style="--width:${baselineTimeWidth}%"></div></div>
                <div class="bar-track"><div class="bar-fill athena" style="--width:${athenaTimeWidth}%"></div></div>
              </div>
              <div class="comparison-number">${metrics.baselineTime ?? "—"} → ${metrics.athenaTime ?? "—"}</div>
            </div>
            <div class="comparison-row">
              <div class="comparison-label"><b>Confidence</b><small>Self-report, 1–5</small></div>
              <div class="bar-pair">
                <div class="bar-track"><div class="bar-fill" style="--width:${confidenceBaselineWidth}%"></div></div>
                <div class="bar-track"><div class="bar-fill athena" style="--width:${confidenceAthenaWidth}%"></div></div>
              </div>
              <div class="comparison-number">${metrics.baselineConfidence ?? "—"} → ${metrics.athenaConfidence ?? "—"}</div>
            </div>
          </div>
        </article>

        <article class="surface">
          <div class="surface-head"><div><h2>Reliability guardrails</h2><p>Judgment entered by the facilitator or advisor reviewer.</p></div></div>
          <div class="surface-body guardrail-list">
            <div class="guardrail"><span>Incorrect recommendations</span><b class="${metrics.incorrectRecommendations ? "alert" : ""}">${metrics.completedSessions ? metrics.incorrectRecommendations : "—"}</b></div>
            <div class="guardrail"><span>Unauthorized actions</span><b class="${metrics.unauthorizedActions ? "alert" : ""}">${metrics.completedSessions ? metrics.unauthorizedActions : "—"}</b></div>
            <div class="guardrail"><span>Advisor corrections</span><b>${metrics.completedSessions ? metrics.totalAdvisorCorrections : "—"}</b></div>
            <div class="guardrail"><span>Recommendation review unknown</span><b class="unknown">${metrics.completedSessions ? metrics.unknownRecommendations : "—"}</b></div>
            <div class="guardrail"><span>Average baseline source switches</span><b>${metrics.averageSourceSwitches ?? "—"}</b></div>
          </div>
        </article>
      </div>

      <article class="surface">
        <div class="surface-head">
          <div><h2>Tester records</h2><p>${sessions.length ? `${sessions.length} local session${sessions.length === 1 ? "" : "s"}` : "No measurements found"}</p></div>
          ${sessions.length ? `<button class="button danger small" type="button" data-action="clear-data">Clear local data</button>` : ""}
        </div>
        ${sessions.length ? sessionTable() : `
          <div class="empty-state">
            <span>A</span>
            <h3>No measurements found</h3>
            <p>Create the first pseudonymous session. The dashboard will remain empty until a tester completes both tasks.</p>
            <button class="button" type="button" data-route="#/facilitator/new">Start new test</button>
          </div>`}
      </article>
    </section>`;
}

function sessionTable() {
  const rows = [...sessions]
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .map(session => `
      <tr>
        <td><strong>${escapeHtml(session.participantCode)}</strong><small>${escapeHtml(session.id.slice(0, 8))}</small></td>
        <td>${statusMarkup(session)}</td>
        <td>${session.baseline.correctCount ?? "—"} / 3<small>${formatDuration(session.baseline.elapsedSeconds)}</small></td>
        <td>${session.athena.correctCount ?? "—"} / 3<small>${formatDuration(session.athena.elapsedSeconds)}</small></td>
        <td>${session.review.incorrectRecommendation === "unknown" ? "Unknown" : escapeHtml(session.review.incorrectRecommendation)}</td>
        <td>${followUpLabel(session.followUp.status)}</td>
        <td><button class="text-button" type="button" data-route="#/facilitator/session/${encodeURIComponent(session.id)}">Open record →</button></td>
      </tr>`).join("");
  return `
    <div class="table-wrap">
      <table>
        <thead><tr><th>Tester</th><th>Status</th><th>Baseline</th><th>Athena</th><th>Recommendation</th><th>7-day action</th><th></th></tr></thead>
        <tbody>${rows}</tbody>
      </table>
    </div>`;
}

function newSessionView(mode = "facilitator") {
  const isFacilitator = mode === "facilitator";
  return `
    <section class="workspace">
      <header class="workspace-head">
        <div><p class="kicker">${isFacilitator ? "Facilitator setup" : "Tester access"}</p><h1>${isFacilitator ? "Create a test session" : "Create a tester-only session"}</h1><p>Use a pseudonymous code. Do not enter a student name, university ID, email, or other direct identifier.</p></div>
        <div class="head-actions"><button class="button secondary" type="button" data-route="${isFacilitator ? "#/facilitator" : "#/tester"}">Cancel</button></div>
      </header>
      <div class="form-shell">
        <aside class="protocol-panel">
          <h2>Eligibility and boundary</h2>
          <p>The research-defined cohort is narrow so the task can test transfer-credit applicability without broader advising confounders.</p>
          <div class="protocol-steps">
            <div class="protocol-step"><b>01</b><span>First-semester transfer student</span></div>
            <div class="protocol-step"><b>02</b><span>30–60 accepted credits</span></div>
            <div class="protocol-step"><b>03</b><span>At least one unresolved equivalency</span></div>
            <div class="protocol-step"><b>04</b><span>Synthetic scenario only in this build</span></div>
          </div>
        </aside>
        <article class="surface form-surface">
          <h2>Minimum session record</h2>
          <p>${isFacilitator ? "After creation, hand this device to the tester or export/import the record across devices." : "After completing both tasks, export your record and send it to the facilitator if you are on another device."}</p>
          <div class="form-error" id="form-error" role="alert"></div>
          <form id="${isFacilitator ? "new-session-form" : "tester-create-form"}">
            <div class="field-grid">
              <div class="field">
                <label for="participant-code">Pseudonymous participant code</label>
                <input id="participant-code" name="participantCode" autocomplete="off" maxlength="30" placeholder="Example: T-A-001" required>
                <span class="help">Do not use initials, email, student ID, or name.</span>
              </div>
              <div class="field">
                <label for="accepted-credits">Accepted transfer credits</label>
                <input id="accepted-credits" name="acceptedCredits" type="number" min="30" max="60" inputmode="numeric" placeholder="30–60" required>
              </div>
              <div class="field full">
                <span class="fieldset-label">Required acknowledgements</span>
                <label class="check-row"><input name="firstSemester" type="checkbox" required><span><b>Cohort fit:</b> this is a first-semester transfer-student test.</span></label>
                <label class="check-row"><input name="unresolved" type="checkbox" required><span><b>Scenario fit:</b> at least one transfer equivalency is unresolved.</span></label>
                <label class="check-row"><input name="synthetic" type="checkbox" required><span><b>Synthetic data:</b> no real student or institutional record will be entered.</span></label>
                <label class="check-row"><input name="consent" type="checkbox" required><span><b>Participation:</b> the tester understands the task and can stop at any time. This acknowledgement is not a substitute for an approved consent process.</span></label>
              </div>
            </div>
            <div class="form-actions">
              <button class="button large" type="submit">${isFacilitator ? "Create session" : "Create and begin"}</button>
              <button class="button secondary large" type="button" data-route="${isFacilitator ? "#/facilitator" : "#/tester"}">Back</button>
            </div>
          </form>
        </article>
      </div>
    </section>`;
}

function testerAccess() {
  const available = sessions.filter(session => !isSessionComplete(session) && !session.review.withdrawn);
  return `
    <section class="workspace">
      <header class="workspace-head">
        <div><p class="kicker">Tester experience</p><h1>Open your session</h1><p>Choose a session already created on this device, or create a tester-only local record.</p></div>
        <div class="head-actions"><button class="button secondary" type="button" data-route="#/choose">Change role</button></div>
      </header>
      <div class="form-shell">
        <aside class="protocol-panel">
          <h2>What you will do</h2>
          <p>Two tasks use the same synthetic transfer-student scenario.</p>
          <div class="protocol-steps">
            <div class="protocol-step"><b>01</b><span>Inspect fragmented advising information.</span></div>
            <div class="protocol-step"><b>02</b><span>Choose the next three actions.</span></div>
            <div class="protocol-step"><b>03</b><span>Review the Athena path view.</span></div>
            <div class="protocol-step"><b>04</b><span>Answer three comprehension questions.</span></div>
          </div>
        </aside>
        <article class="surface form-surface">
          <h2>${available.length ? "Sessions on this device" : "No local session found"}</h2>
          <p>${available.length ? "Select the pseudonymous code provided by the facilitator." : "Ask the facilitator to create a session, or create a tester-only record for remote testing."}</p>
          ${available.length ? `
            <form id="tester-access-form">
              <div class="field">
                <label for="session-select">Participant code</label>
                <select id="session-select" name="sessionId" required>
                  <option value="">Choose a session</option>
                  ${available.map(session => `<option value="${escapeHtml(session.id)}">${escapeHtml(session.participantCode)} · ${sessionStatus(session)[0]}</option>`).join("")}
                </select>
              </div>
              <div class="form-actions"><button class="button large" type="submit">Continue test</button><button class="button secondary large" type="button" data-route="#/tester/new">Create tester-only record</button></div>
            </form>` : `
            <div class="form-actions"><button class="button large" type="button" data-route="#/tester/new">Create tester-only record</button><button class="button secondary large" type="button" data-route="#/choose">Back</button></div>`}
          <div class="boundary-banner" style="margin-top:24px;margin-bottom:0">
            <span class="icon">i</span>
            <div>A link cannot synchronize records across devices. Remote testers must export their completed JSON record for facilitator import.</div>
          </div>
        </article>
      </div>
    </section>`;
}

function testerSessionView(session) {
  if (!session) return notFound("Tester session");
  switch (session.status) {
    case "orientation":
      return testerIntro(session);
    case "baseline-active":
      return baselineTask(session);
    case "transition":
      return transitionView(session);
    case "athena-active":
      return athenaTask(session);
    case "awaiting-review":
    case "reviewed":
      return testerComplete(session);
    default:
      return testerIntro(session);
  }
}

function testerIntro(session) {
  return `
    <section class="tester-shell">
      ${testerHeader(session, false)}
      <div class="tester-stage tester-intro">
        <span class="stage-number">1</span>
        <p class="kicker">Baseline task · Fragmented information</p>
        <h1>Find the next three actions.</h1>
        <p>You will inspect four simulated sources for a first-semester Mechanical Engineering transfer student. Work as you naturally would. The timer begins when you start.</p>
        <button class="button large" type="button" data-action="start-baseline" data-session="${escapeHtml(session.id)}">Start baseline</button>
        <p class="tester-note">The scenario is synthetic. It is not your academic record and must not be used for registration or advising decisions.</p>
      </div>
    </section>`;
}

function testerHeader(session, timed = true) {
  return `
    <header class="tester-head">
      <div><b>Tester ${escapeHtml(session.participantCode)}</b><small>Session ${escapeHtml(session.id.slice(0, 8))} · saved locally</small></div>
      ${timed ? `<div class="timer"><i></i><span id="timer">00:00</span></div>` : `<span class="status progress">Synthetic scenario</span>`}
    </header>`;
}

function baselineTask(session) {
  const sourceId = SOURCE_IDS.includes(session.baseline.activeSource) ? session.baseline.activeSource : "ulink";
  return `
    <section class="tester-shell">
      ${testerHeader(session)}
      <div class="tester-stage">
        <header class="task-head">
          <div><p class="kicker">Stage 1 · Baseline</p><h1>What should this student do next?</h1><p>Inspect any sources you need, choose exactly three actions, and identify which action comes first.</p></div>
          <div class="task-meta">${session.baseline.sourcesOpened.length} of 4 sources opened<br>${session.baseline.sourceSwitches} source switches</div>
        </header>
        <div class="baseline-layout">
          <article class="surface source-workspace">
            <nav class="source-tabs" aria-label="Synthetic advising sources">
              ${SOURCE_IDS.map(id => `<button class="source-tab ${id === sourceId ? "active" : ""} ${session.baseline.sourcesOpened.includes(id) ? "opened" : ""}" type="button" data-action="open-source" data-session="${escapeHtml(session.id)}" data-source="${id}">${sourceName(id)}</button>`).join("")}
            </nav>
            <div class="source-content">${sourceContent(sourceId)}</div>
          </article>
          <form class="surface answer-panel" id="baseline-form" data-session="${escapeHtml(session.id)}">
            <h2>Your answer</h2>
            <p>Select the three actions you believe matter now. There is no penalty for changing your answer before submission.</p>
            <div class="form-error" id="form-error" role="alert"></div>
            <div class="choice-list">
              ${ACTIONS.map(([id, label]) => `<label class="choice"><input type="checkbox" name="actions" value="${id}"><span>${label}</span></label>`).join("")}
            </div>
            <div class="question">
              <label for="baseline-first-action">Which action comes first?</label>
              <select id="baseline-first-action" name="firstAction" required>
                <option value="">Choose one</option>
                ${ACTIONS.map(([id, label]) => `<option value="${id}">${label}</option>`).join("")}
              </select>
            </div>
            ${confidenceField("baseline-confidence")}
            <div class="form-actions"><button class="button" type="submit">Submit baseline answer</button></div>
          </form>
        </div>
      </div>
    </section>`;
}

function sourceName(id) {
  return ({ ulink: "ULink", degreeworks: "DegreeWorks", transfer: "Transfer evaluation", advisor: "Advisor email" })[id];
}

function sourceContent(id) {
  const content = {
    ulink: `
      <div class="source-brand"><span>UL</span>ULink registration dashboard</div>
      <h2>Registration status</h2>
      <p>Summary information from the simulated student portal.</p>
      <div class="record-list">
        <div class="record-row"><span>Student program</span><b>${scenario.major}</b></div>
        <div class="record-row"><span>Registration time ticket</span><b>${scenario.timeTicket}</b></div>
        <div class="record-row"><span>Active holds</span><b class="warning">${scenario.hold}</b></div>
        <div class="record-row"><span>Assigned advisor</span><b>${scenario.advisor}</b></div>
      </div>`,
    degreeworks: `
      <div class="source-brand"><span>DW</span>DegreeWorks audit</div>
      <h2>Degree progress</h2>
      <p>Transfer credits may be accepted by the institution without applying to this major.</p>
      <div class="record-list">
        <div class="record-row"><span>Accepted transfer credits</span><b>${scenario.acceptedCredits}</b></div>
        <div class="record-row"><span>Applied to degree</span><b>${scenario.appliedCredits}</b></div>
        <div class="record-row"><span>Fallthrough section</span><b class="warning">${scenario.fallthroughCredits} credits · ELEC 1xx</b></div>
        <div class="record-row"><span>Audit note</span><b>Department review may be required</b></div>
      </div>`,
    transfer: `
      <div class="source-brand"><span>TE</span>Transfer evaluation status</div>
      <h2>Credit evaluation</h2>
      <p>The simulated transcript evaluation has accepted all credits at the institutional level. Applicability is not final for every course.</p>
      <div class="record-list">
        <div class="record-row"><span>Credits accepted</span><b>${scenario.acceptedCredits}</b></div>
        <div class="record-row"><span>Direct equivalencies</span><b>54 credits</b></div>
        <div class="record-row"><span>Pending applicability</span><b class="warning">${scenario.fallthroughCredits} ELEC 1xx credits</b></div>
        <div class="record-row"><span>Next reviewer</span><b>Mechanical Engineering department</b></div>
      </div>`,
    advisor: `
      <div class="source-brand"><span>✉</span>Simulated advisor message</div>
      <h2>Prepare for registration</h2>
      <p>From: ${scenario.advisor} · Academic advising</p>
      <div class="record-list">
        <div class="record-row"><span>Message</span><b>Please schedule your mandatory advising appointment before your registration time ticket opens.</b></div>
        <div class="record-row"><span>Bring</span><b>Your DegreeWorks audit and questions about unmatched transfer courses.</b></div>
        <div class="record-row"><span>Important</span><b class="warning">The advising hold remains until the appointment is completed.</b></div>
      </div>`
  };
  return content[id] || content.ulink;
}

function confidenceField(id) {
  return `
    <fieldset class="question" style="border:0;padding:0">
      <legend>How confident are you? · 1 low, 5 high</legend>
      <div class="rating">
        ${[1,2,3,4,5].map(value => `<label><input type="radio" name="confidence" value="${value}" required><span>${value}</span></label>`).join("")}
      </div>
    </fieldset>`;
}

function transitionView(session) {
  return `
    <section class="tester-shell">
      ${testerHeader(session, false)}
      <div class="tester-stage tester-intro">
        <span class="stage-number">2</span>
        <p class="kicker">Athena task · Simplified path</p>
        <h1>Now use one student-centered view.</h1>
        <p>The same synthetic record has been translated into current position, next moves, blockers, and one question for the advisor. A new timer begins when you continue.</p>
        <button class="button large" type="button" data-action="start-athena" data-session="${escapeHtml(session.id)}">Open Athena view</button>
      </div>
    </section>`;
}

function athenaTask(session) {
  return `
    <section class="tester-shell">
      ${testerHeader(session)}
      <div class="tester-stage">
        <header class="task-head">
          <div><p class="kicker">Stage 2 · Athena</p><h1>Read the path, then answer.</h1><p>Use only the view below. Each proposed action remains subject to advisor or department review.</p></div>
          <div class="task-meta">Same synthetic scenario<br>Human verification preserved</div>
        </header>
        <article class="athena-view">
          <div class="athena-window-bar"><span>Athena student path · Synthetic record</span><span class="verified-label">Advisor review required</span></div>
          <div class="athena-window">
            <h2>Your path, made clear.</h2>
            <p>Current as of this synthetic registration scenario.</p>
            <div class="athena-panels">
              <section class="athena-panel">
                <h3>My position</h3>
                <div class="position-list">
                  <div class="position-item"><span>Major</span><b>${scenario.major}</b></div>
                  <div class="position-item"><span>Credits applied</span><b>${scenario.appliedCredits} / ${scenario.acceptedCredits}</b></div>
                  <div class="position-item"><span>Time ticket</span><b>${scenario.timeTicket}</b></div>
                </div>
              </section>
              <section class="athena-panel">
                <h3>My next three moves</h3>
                <div class="move"><b>1</b><div><strong>Schedule your mandatory advising appointment</strong><p>Your advising hold blocks registration. Complete this before April 2.</p></div></div>
                <div class="move"><b>2</b><div><strong>Ask about a course substitution for ELEC 1xx</strong><p>Six accepted credits do not currently apply to your major. The advisor/department must decide applicability.</p></div></div>
                <div class="move"><b>3</b><div><strong>Review the sophomore curriculum sheet</strong><p>Prepare questions about courses that follow from the unresolved credit review.</p></div></div>
              </section>
              <section class="athena-panel">
                <h3>My blockers</h3>
                <div class="blocker"><b>Active advising hold</b><br>${scenario.advisor} must complete the advising step before registration.</div>
                <div class="advisor-question">“Can my 6 ELEC 1xx credits be reviewed for the required technical electives?”</div>
              </section>
            </div>
          </div>
        </article>
        <form class="surface athena-answer" id="athena-form" data-session="${escapeHtml(session.id)}">
          <div class="form-error" id="form-error" role="alert"></div>
          <div class="question-grid">
            <div class="question">
              <label for="athena-first-action">What comes first?</label>
              <select id="athena-first-action" name="firstAction" required>
                <option value="">Choose one</option>
                <option value="schedule-advising">Schedule the advising appointment</option>
                <option value="register-now">Register immediately</option>
                <option value="contact-financial-aid">Contact Financial Aid</option>
              </select>
            </div>
            <div class="question">
              <label for="athena-deadline">When should it happen?</label>
              <select id="athena-deadline" name="deadline" required>
                <option value="">Choose one</option>
                <option value="before-april2">Before April 2</option>
                <option value="after-registration">After registration</option>
                <option value="end-semester">At the end of the semester</option>
              </select>
            </div>
            <div class="question">
              <label for="athena-approver">Who decides credit applicability?</label>
              <select id="athena-approver" name="approver" required>
                <option value="">Choose one</option>
                <option value="student">The student alone</option>
                <option value="athena">Athena automatically</option>
                <option value="advisor-department">Advisor or academic department</option>
              </select>
            </div>
          </div>
          <div class="question-grid" style="margin-top:15px">
            <div>${confidenceField("athena-confidence")}</div>
            <div class="question" style="grid-column:span 2">
              <label for="intended-action">What would you do immediately after this screen?</label>
              <select id="intended-action" name="intendedAction" required>
                <option value="">Choose one</option>
                ${ACTIONS.map(([id, label]) => `<option value="${id}">${label}</option>`).join("")}
              </select>
            </div>
          </div>
          <div class="form-actions"><button class="button" type="submit">Submit Athena answer</button></div>
        </form>
      </div>
    </section>`;
}

function testerComplete(session) {
  const accuracyChange = session.athena.correctCount - session.baseline.correctCount;
  const timeChange = session.baseline.elapsedSeconds - session.athena.elapsedSeconds;
  return `
    <section class="tester-shell">
      ${testerHeader(session, false)}
      <div class="tester-stage tester-intro">
        <span class="stage-number">✓</span>
        <p class="kicker">Tester tasks complete</p>
        <h1>Your record is ready for review.</h1>
        <p>Thank you. This screen does not say whether Athena passed. The facilitator must review correctness, guardrails, protocol quality, and any real follow-up evidence.</p>
        <div class="surface" style="width:min(100%,620px);margin-top:25px;text-align:left">
          <div class="record-metrics">
            <div class="record-metric"><span>Baseline accuracy</span><b>${session.baseline.correctCount} / 3</b></div>
            <div class="record-metric"><span>Athena accuracy</span><b>${session.athena.correctCount} / 3</b></div>
            <div class="record-metric"><span>Accuracy change</span><b>${accuracyChange > 0 ? "+" : ""}${accuracyChange}</b></div>
            <div class="record-metric"><span>Time change</span><b>${timeChange > 0 ? `${timeChange}s faster` : timeChange < 0 ? `${Math.abs(timeChange)}s slower` : "No change"}</b></div>
          </div>
        </div>
        <div class="form-actions" style="justify-content:center">
          <button class="button large" type="button" data-action="export-session" data-session="${escapeHtml(session.id)}">Export tester record</button>
          <button class="button secondary large" type="button" data-route="#/choose">Finish and change role</button>
        </div>
        <p class="tester-note">If testing remotely, send the exported JSON file to the facilitator. It contains the pseudonymous session record and your task responses.</p>
      </div>
    </section>`;
}

function facilitatorRecord(session) {
  if (!session) return notFound("Facilitator record");
  const tasksComplete = Boolean(session.baseline.completedAt && session.athena.completedAt);
  return `
    <section class="workspace">
      <header class="workspace-head">
        <div><p class="kicker">Facilitator record</p><h1>${escapeHtml(session.participantCode)}</h1><p>Session ${escapeHtml(session.id.slice(0, 8))} · created ${formatDate(session.createdAt)}</p></div>
        <div class="head-actions">
          <button class="button secondary" type="button" data-action="export-session" data-session="${escapeHtml(session.id)}">Export record</button>
          <button class="button secondary" type="button" data-route="#/facilitator">Back to dashboard</button>
        </div>
      </header>
      <div class="boundary-banner">
        <span class="icon">!</span>
        <div>Do not enter names, student IDs, emails, grades, financial-aid details, disability information, disciplinary data, or other direct identifiers in the notes.</div>
      </div>
      <div class="record-layout">
        <aside class="surface record-summary">
          <div class="record-identity"><span>${statusMarkup(session)}</span><h2>${escapeHtml(session.participantCode)}</h2><p>${session.eligibility.acceptedCredits} accepted credits · unresolved equivalency</p></div>
          <div class="record-metrics">
            <div class="record-metric"><span>Baseline accuracy</span><b>${session.baseline.correctCount ?? "—"} / 3</b></div>
            <div class="record-metric"><span>Baseline time</span><b>${formatDuration(session.baseline.elapsedSeconds)}</b></div>
            <div class="record-metric"><span>Sources / switches</span><b>${session.baseline.sourcesOpened.length} / ${session.baseline.sourceSwitches}</b></div>
            <div class="record-metric"><span>Athena accuracy</span><b>${session.athena.correctCount ?? "—"} / 3</b></div>
            <div class="record-metric"><span>Athena time</span><b>${formatDuration(session.athena.elapsedSeconds)}</b></div>
            <div class="record-metric"><span>Confidence</span><b>${session.baseline.confidence ?? "—"} → ${session.athena.confidence ?? "—"}</b></div>
          </div>
        </aside>
        ${tasksComplete ? reviewForm(session) : `
          <article class="surface empty-state" style="min-height:420px;display:grid;place-items:center;align-content:center">
            <span>A</span><h3>Tester tasks are not complete</h3><p>Open the tester experience and hand off the device. The session will remain resumable in this browser.</p>
            <button class="button" type="button" data-route="#/tester/${encodeURIComponent(session.id)}">Open tester experience</button>
          </article>`}
      </div>
    </section>`;
}

function reviewForm(session) {
  return `
    <form class="surface review-form" id="review-form" data-session="${escapeHtml(session.id)}">
      <section>
        <h3>Advisor and facilitator review</h3>
        <p>These fields are judgment evidence. Leave the recommendation status Unknown until an authorized reviewer has assessed it.</p>
        <div class="field-grid">
          <div class="field">
            <label for="correction-count">Advisor correction count</label>
            <input id="correction-count" name="advisorCorrectionCount" type="number" min="0" value="${session.review.advisorCorrectionCount ?? ""}" placeholder="Unknown">
          </div>
          <div class="field">
            <label for="incorrect-recommendation">Any incorrect recommendation?</label>
            <select id="incorrect-recommendation" name="incorrectRecommendation">
              ${selectOptions([["unknown","Unknown / not reviewed"],["no","No"],["yes","Yes"]], session.review.incorrectRecommendation)}
            </select>
          </div>
          <div class="field full">
            <label class="check-row"><input name="unauthorizedAction" type="checkbox" ${session.review.unauthorizedAction ? "checked" : ""}><span>An unauthorized action or access attempt occurred.</span></label>
            <label class="check-row"><input name="withdrawn" type="checkbox" ${session.review.withdrawn ? "checked" : ""}><span>The tester withdrew; exclude from completed-session metrics.</span></label>
          </div>
          <div class="field full">
            <label for="invalid-reason">Invalid-session reason</label>
            <input id="invalid-reason" name="invalidReason" value="${escapeHtml(session.review.invalidReason)}" placeholder="Leave blank if protocol was valid">
          </div>
          <div class="field full">
            <label for="review-notes">Facilitator observations</label>
            <textarea id="review-notes" name="notes" placeholder="Record observable behavior before interpretation.">${escapeHtml(session.review.notes)}</textarea>
          </div>
        </div>
      </section>
      <section>
        <h3>Seven-day follow-up</h3>
        <p>Intent is not completion. Record Verified only when an advisor-reviewed action has evidence of completion.</p>
        <div class="field-grid">
          <div class="field">
            <label for="follow-up-status">Outcome status</label>
            <select id="follow-up-status" name="followUpStatus">
              ${selectOptions([["unknown","Unknown / not due"],["verified","Verified action completed"],["not-completed","Known not completed"]], session.followUp.status)}
            </select>
          </div>
          <div class="field">
            <label for="action-type">Action type</label>
            <select id="action-type" name="actionType">
              ${selectOptions([["","Not recorded"],...ACTIONS.slice(0,3)], session.followUp.actionType)}
            </select>
          </div>
          <div class="field">
            <label for="days-to-action">Days to verified action</label>
            <input id="days-to-action" name="daysToAction" type="number" min="0" max="7" value="${session.followUp.daysToAction ?? ""}" placeholder="0–7">
          </div>
          <div class="field full">
            <label for="follow-up-notes">Follow-up evidence note</label>
            <textarea id="follow-up-notes" name="followUpNotes" placeholder="Describe what was verified and by whom without adding direct identifiers.">${escapeHtml(session.followUp.notes)}</textarea>
          </div>
        </div>
      </section>
      <div class="review-actions"><button class="button" type="submit">Save review and recalculate</button></div>
    </form>`;
}

function selectOptions(options, selected) {
  return options.map(([value, label]) => `<option value="${escapeHtml(value)}" ${value === selected ? "selected" : ""}>${escapeHtml(label)}</option>`).join("");
}

function followUpLabel(status) {
  return ({ verified: "Verified", "not-completed": "Not completed", unknown: "Unknown" })[status] || "Unknown";
}

function notFound(label) {
  return `
    <section class="workspace">
      <div class="empty-state">
        <span>!</span><h3>${escapeHtml(label)} not found</h3><p>The record may exist on another device or may have been cleared from this browser.</p>
        <button class="button" type="button" data-route="#/choose">Return to role selection</button>
      </div>
    </section>`;
}

function showFormError(message) {
  const error = document.getElementById("form-error");
  if (!error) {
    showToast(message);
    return;
  }
  error.textContent = message;
  error.classList.add("visible");
  error.scrollIntoView({ behavior: "smooth", block: "center" });
}

function elapsedFrom(startedAt) {
  return Math.max(0, Math.floor((Date.now() - new Date(startedAt).getTime()) / 1000));
}

function download(name, content, type) {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = name;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

function exportPayload(records) {
  return JSON.stringify({
    schema: EXPORT_SCHEMA,
    exportedAt: nowIso(),
    sessions: records
  }, null, 2);
}

function render(scrollTop = false) {
  clearTimer();
  const [area, action, id] = routeParts();

  if (area === "choose") app.innerHTML = roleGate();
  else if (area === "facilitator" && !action) app.innerHTML = facilitatorDashboard();
  else if (area === "facilitator" && action === "new") app.innerHTML = newSessionView("facilitator");
  else if (area === "facilitator" && action === "session") app.innerHTML = facilitatorRecord(getSession(decodeURIComponent(id || "")));
  else if (area === "tester" && !action) app.innerHTML = testerAccess();
  else if (area === "tester" && action === "new") app.innerHTML = newSessionView("tester");
  else if (area === "tester") app.innerHTML = testerSessionView(getSession(decodeURIComponent(action)));
  else app.innerHTML = roleGate();

  if (scrollTop) window.scrollTo({ top: 0, behavior: "instant" });
  const activeSession = area === "tester" && action && action !== "new" ? getSession(decodeURIComponent(action)) : null;
  if (activeSession?.status === "baseline-active") startVisibleTimer(activeSession.baseline.startedAt);
  if (activeSession?.status === "athena-active") startVisibleTimer(activeSession.athena.startedAt);
  app.focus({ preventScroll: true });
}

document.addEventListener("click", event => {
  const routeTarget = event.target.closest("[data-route]");
  if (routeTarget) {
    event.preventDefault();
    navigate(routeTarget.dataset.route);
    return;
  }

  const actionTarget = event.target.closest("[data-action]");
  if (!actionTarget) return;
  const action = actionTarget.dataset.action;
  const sessionId = actionTarget.dataset.session;

  if (action === "start-baseline") {
    updateSession(sessionId, session => {
      session.status = "baseline-active";
      session.baseline.startedAt ||= nowIso();
      session.baseline.activeSource = "ulink";
      session.baseline.lastSource = "ulink";
      if (!session.baseline.sourcesOpened.includes("ulink")) {
        session.baseline.sourcesOpened.push("ulink");
      }
    });
    render(true);
  }

  if (action === "open-source") {
    updateSession(sessionId, session => {
      const nextSource = actionTarget.dataset.source;
      if (session.baseline.lastSource && session.baseline.lastSource !== nextSource) {
        session.baseline.sourceSwitches += 1;
      }
      if (!session.baseline.sourcesOpened.includes(nextSource)) {
        session.baseline.sourcesOpened.push(nextSource);
      }
      session.baseline.lastSource = nextSource;
      session.baseline.activeSource = nextSource;
    });
    render(false);
  }

  if (action === "start-athena") {
    updateSession(sessionId, session => {
      session.status = "athena-active";
      session.athena.startedAt ||= nowIso();
    });
    render(true);
  }

  if (action === "export-json") {
    download("Athena_Test_A_Sessions.json", exportPayload(sessions), "application/json");
    showToast("JSON dataset exported");
  }

  if (action === "export-csv") {
    download("Athena_Test_A_Sessions.csv", sessionsToCsv(sessions), "text/csv;charset=utf-8");
    showToast("CSV dataset exported");
  }

  if (action === "export-session") {
    const session = getSession(sessionId);
    if (!session) return;
    download(`Athena_Test_A_${session.participantCode}.json`, exportPayload([session]), "application/json");
    showToast("Tester record exported");
  }

  if (action === "clear-data") {
    if (!confirm("Clear every Athena Test A session stored in this browser? Export first if the data should be retained.")) return;
    sessions = [];
    persist();
    render(false);
    showToast("Local Test A data cleared");
  }
});

document.addEventListener("submit", event => {
  event.preventDefault();
  const form = event.target;
  const data = new FormData(form);

  if (["new-session-form", "tester-create-form"].includes(form.id)) {
    const acceptedCredits = Number(data.get("acceptedCredits"));
    const participantCode = String(data.get("participantCode") || "").trim();
    if (!participantCode) return showFormError("Enter a pseudonymous participant code.");
    if (sessions.some(session => session.participantCode.toLowerCase() === participantCode.toLowerCase())) {
      return showFormError("That participant code already exists in this browser.");
    }
    if (acceptedCredits < 30 || acceptedCredits > 60) {
      return showFormError("Test A is scoped to 30–60 accepted credits.");
    }
    if (!data.get("firstSemester") || !data.get("unresolved") || !data.get("synthetic") || !data.get("consent")) {
      return showFormError("Complete every acknowledgement before creating the session.");
    }
    const session = createSession({
      participantCode,
      acceptedCredits,
      createdBy: form.id === "new-session-form" ? "facilitator" : "tester"
    });
    sessions.push(session);
    persist();
    navigate(form.id === "new-session-form"
      ? `#/facilitator/session/${session.id}`
      : `#/tester/${session.id}`);
    showToast("Pseudonymous session created");
  }

  if (form.id === "tester-access-form") {
    const id = String(data.get("sessionId") || "");
    if (!getSession(id)) return showFormError("Choose a local session.");
    navigate(`#/tester/${id}`);
  }

  if (form.id === "baseline-form") {
    const id = form.dataset.session;
    const session = getSession(id);
    const selectedActions = data.getAll("actions").map(String);
    const firstAction = String(data.get("firstAction") || "");
    const confidence = Number(data.get("confidence"));
    if (selectedActions.length !== 3) return showFormError("Select exactly three actions.");
    if (!firstAction || !confidence) return showFormError("Choose the first action and a confidence rating.");
    updateSession(id, record => {
      record.baseline.completedAt = nowIso();
      record.baseline.elapsedSeconds = elapsedFrom(record.baseline.startedAt);
      record.baseline.selectedActions = selectedActions;
      record.baseline.firstAction = firstAction;
      record.baseline.firstActionCorrect = firstAction === "schedule-advising";
      record.baseline.correctCount = selectedActions.filter(action => CORRECT_ACTIONS.has(action)).length;
      record.baseline.confidence = confidence;
      record.status = "transition";
    });
    render(true);
    showToast("Baseline response saved");
  }

  if (form.id === "athena-form") {
    const id = form.dataset.session;
    const firstAction = String(data.get("firstAction") || "");
    const deadline = String(data.get("deadline") || "");
    const approver = String(data.get("approver") || "");
    const confidence = Number(data.get("confidence"));
    const intendedAction = String(data.get("intendedAction") || "");
    if (!firstAction || !deadline || !approver || !confidence || !intendedAction) {
      return showFormError("Complete every comprehension and confidence field.");
    }
    const correctCount = [
      firstAction === "schedule-advising",
      deadline === "before-april2",
      approver === "advisor-department"
    ].filter(Boolean).length;
    updateSession(id, record => {
      record.athena.completedAt = nowIso();
      record.athena.elapsedSeconds = elapsedFrom(record.athena.startedAt);
      record.athena.answers = { firstAction, deadline, approver };
      record.athena.firstActionCorrect = firstAction === "schedule-advising";
      record.athena.correctCount = correctCount;
      record.athena.confidence = confidence;
      record.athena.intendedAction = intendedAction;
      record.status = "awaiting-review";
    });
    render(true);
    showToast("Athena response saved");
  }

  if (form.id === "review-form") {
    const id = form.dataset.session;
    const correctionRaw = String(data.get("advisorCorrectionCount") || "").trim();
    const daysRaw = String(data.get("daysToAction") || "").trim();
    updateSession(id, record => {
      record.review.advisorCorrectionCount = correctionRaw === "" ? null : Number(correctionRaw);
      record.review.incorrectRecommendation = String(data.get("incorrectRecommendation") || "unknown");
      record.review.unauthorizedAction = Boolean(data.get("unauthorizedAction"));
      record.review.withdrawn = Boolean(data.get("withdrawn"));
      record.review.invalidReason = String(data.get("invalidReason") || "").trim();
      record.review.notes = String(data.get("notes") || "").trim();
      record.followUp.status = String(data.get("followUpStatus") || "unknown");
      record.followUp.actionType = String(data.get("actionType") || "");
      record.followUp.daysToAction = daysRaw === "" ? null : Number(daysRaw);
      record.followUp.notes = String(data.get("followUpNotes") || "").trim();
      record.status = "reviewed";
    });
    render(false);
    showToast("Review saved and dashboard recalculated");
  }
});

document.addEventListener("change", async event => {
  if (event.target.id !== "import-file") return;
  const file = event.target.files?.[0];
  if (!file) return;
  try {
    const payload = JSON.parse(await file.text());
    if (payload.schema !== EXPORT_SCHEMA || !Array.isArray(payload.sessions)) {
      throw new Error("Schema mismatch");
    }
    const valid = payload.sessions.filter(validateImportedSession);
    if (!valid.length) throw new Error("No valid sessions");
    const byId = new Map(sessions.map(session => [session.id, session]));
    for (const imported of valid) {
      const existing = byId.get(imported.id);
      if (!existing || new Date(imported.updatedAt) >= new Date(existing.updatedAt)) {
        byId.set(imported.id, imported);
      }
    }
    sessions = [...byId.values()];
    persist();
    render(false);
    showToast(`${valid.length} valid session${valid.length === 1 ? "" : "s"} imported`);
  } catch {
    showToast("Import failed: not a valid Athena Test A export");
  } finally {
    event.target.value = "";
  }
});

window.addEventListener("hashchange", () => render(true));

if (!location.hash) {
  const role = new URLSearchParams(location.search).get("role");
  location.hash = role === "facilitator" ? "#/facilitator" : role === "tester" ? "#/tester" : "#/choose";
} else {
  render(true);
}
