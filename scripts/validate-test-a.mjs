import { execFileSync } from "node:child_process";
import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";
import {
  SESSION_SCHEMA,
  computeMetrics,
  sessionsToCsv,
  validateImportedSession
} from "../test-a/metrics.mjs";

const root = resolve(import.meta.dirname, "..");
const required = [
  "test-a/index.html",
  "test-a/styles.css",
  "test-a/app.mjs",
  "test-a/metrics.mjs",
  "products/test-a/PRODUCT_BRIEF.md",
  "products/test-a/SIGNAL_DICTIONARY.md"
];
const failures = [];

for (const file of required) {
  if (!existsSync(resolve(root, file))) failures.push(`missing Test A file: ${file}`);
}

for (const file of ["test-a/app.mjs", "test-a/metrics.mjs"]) {
  try {
    execFileSync(process.execPath, ["--check", resolve(root, file)], { stdio: "pipe" });
  } catch (error) {
    failures.push(`${file} failed syntax parsing: ${error.stderr?.toString().trim() || error.message}`);
  }
}

const testHtml = readFileSync(resolve(root, "test-a/index.html"), "utf8");
const appSource = readFileSync(resolve(root, "test-a/app.mjs"), "utf8");
const assembledSource = `${testHtml}\n${appSource}`;
for (const expected of ["Facilitator", "Tester", "Synthetic", "local only"]) {
  if (!assembledSource.toLowerCase().includes(expected.toLowerCase())) {
    failures.push(`Test A source is missing required boundary copy: ${expected}`);
  }
}

const mainHtml = readFileSync(resolve(root, "index.html"), "utf8");
if (!mainHtml.includes('href="test-a/"') || !mainHtml.includes("Start Test A")) {
  failures.push("research portal does not link to Start Test A");
}

const productBrief = readFileSync(resolve(root, "products/test-a/PRODUCT_BRIEF.md"), "utf8");
const sidecarBrief = readFileSync(resolve(root, ".pawbytes/prodig-suites/products/athena-test-a/product-brief.md"), "utf8");
if (productBrief !== sidecarBrief) failures.push("public and sidecar product briefs have drifted");

function fixture(overrides = {}) {
  return {
    schema: SESSION_SCHEMA,
    id: overrides.id || crypto.randomUUID(),
    participantCode: overrides.participantCode || "FIXTURE",
    createdAt: "2026-07-29T00:00:00.000Z",
    updatedAt: "2026-07-29T00:00:00.000Z",
    status: overrides.status || "reviewed",
    eligibility: { acceptedCredits: 45 },
    baseline: {
      completedAt: "2026-07-29T00:01:00.000Z",
      elapsedSeconds: overrides.baselineTime ?? 120,
      correctCount: overrides.baselineCorrect ?? 1,
      firstActionCorrect: false,
      confidence: overrides.baselineConfidence ?? 2,
      sourcesOpened: ["ulink", "degreeworks", "transfer", "advisor"],
      sourceSwitches: overrides.switches ?? 5
    },
    athena: {
      completedAt: "2026-07-29T00:02:00.000Z",
      elapsedSeconds: overrides.athenaTime ?? 40,
      correctCount: overrides.athenaCorrect ?? 3,
      firstActionCorrect: true,
      confidence: overrides.athenaConfidence ?? 5,
      intendedAction: "schedule-advising"
    },
    review: {
      advisorCorrectionCount: overrides.corrections ?? 0,
      incorrectRecommendation: overrides.incorrectRecommendation ?? "no",
      unauthorizedAction: false,
      withdrawn: false,
      invalidReason: "",
      notes: ""
    },
    followUp: {
      status: overrides.followUp ?? "verified",
      actionType: "schedule-advising",
      daysToAction: overrides.daysToAction ?? 3,
      notes: ""
    }
  };
}

const records = [
  fixture({ id: "one", participantCode: "FIX-001" }),
  fixture({
    id: "two",
    participantCode: "FIX-002",
    baselineTime: 90,
    athenaTime: 60,
    baselineCorrect: 2,
    baselineConfidence: 3,
    athenaConfidence: 4,
    switches: 4,
    corrections: 1,
    incorrectRecommendation: "unknown",
    followUp: "unknown",
    daysToAction: null
  }),
  {
    ...fixture({ id: "three", participantCode: "FIX-003" }),
    status: "baseline-active",
    baseline: { ...fixture().baseline, completedAt: null },
    athena: { ...fixture().athena, completedAt: null }
  }
];

const metrics = computeMetrics(records);
const expected = {
  totalSessions: 3,
  completedSessions: 2,
  inProgressSessions: 1,
  baselineAccuracy: 1.5,
  athenaAccuracy: 3,
  accuracyLift: 1.5,
  baselineTime: 105,
  athenaTime: 50,
  timeReductionPercent: 52.4,
  totalAdvisorCorrections: 1,
  followUpKnown: 1,
  followUpUnknown: 1,
  verifiedActionRate: 100,
  unknownRecommendations: 1
};

for (const [field, value] of Object.entries(expected)) {
  if (metrics[field] !== value) {
    failures.push(`metric ${field}: expected ${value}, received ${metrics[field]}`);
  }
}

if (!validateImportedSession(records[0])) failures.push("valid Test A session failed schema validation");
if (validateImportedSession({ schema: "wrong" })) failures.push("invalid Test A session passed schema validation");

const csv = sessionsToCsv(records.slice(0, 2));
if (csv.split("\n").length !== 3 || !csv.includes("participant_code") || !csv.includes("FIX-002")) {
  failures.push("CSV export did not contain the expected header and participant rows");
}

if (failures.length) {
  console.error("Athena Test A validation failed:");
  failures.forEach(failure => console.error(`- ${failure}`));
  process.exit(1);
}

console.log("Athena Test A validation passed");
console.log(`- ${required.length} required product files`);
console.log("- application and metrics syntax");
console.log("- product brief synchronization");
console.log("- fixture-based aggregate signal calculations");
console.log("- session schema and CSV export");
