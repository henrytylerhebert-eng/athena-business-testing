import { createHash } from "node:crypto";
import { existsSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const entry = resolve(root, "index.html");
const packagedPortal = resolve(root, "athena_package", "Athena_Research_Workspace_Portal.html");
const failures = [];

function fail(message) {
  failures.push(message);
}

function hash(content) {
  return createHash("sha256").update(content).digest("hex");
}

if (!existsSync(entry)) fail("index.html is missing");
if (!existsSync(packagedPortal)) fail("packaged portal copy is missing");

const html = existsSync(entry) ? readFileSync(entry, "utf8") : "";
const packagedHtml = existsSync(packagedPortal) ? readFileSync(packagedPortal, "utf8") : "";

if (!/^<!doctype html>/i.test(html)) fail("index.html must begin with an HTML doctype");
if (!/<title>Athena Research Workspace<\/title>/.test(html)) fail("expected page title is missing");
if ((html.match(/<h1\b/g) || []).length !== 1) fail("index.html must contain exactly one h1");
if (hash(html) !== hash(packagedHtml)) fail("index.html and the packaged portal copy have drifted");

const ids = new Set([...html.matchAll(/\sid="([^"]+)"/g)].map(match => match[1]));
const anchors = [...html.matchAll(/href="#([^"]+)"/g)].map(match => match[1]);
for (const anchor of anchors) {
  if (!ids.has(anchor)) fail(`missing anchor target: #${anchor}`);
}

const localHrefs = [...html.matchAll(/href="([^"]+)"/g)]
  .map(match => match[1])
  .filter(href => !/^(?:https?:|mailto:|tel:|#|data:|javascript:)/i.test(href));

for (const href of localHrefs) {
  const cleanPath = decodeURIComponent(href.split(/[?#]/)[0]);
  if (!existsSync(resolve(root, cleanPath))) fail(`missing local link target: ${href}`);
}

const scripts = [...html.matchAll(/<script>([\s\S]*?)<\/script>/g)].map(match => match[1]);
if (!scripts.length) fail("no inline application script found");
for (const [index, script] of scripts.entries()) {
  try {
    Function(script);
  } catch (error) {
    fail(`inline script ${index + 1} failed syntax parsing: ${error.message}`);
  }
}

const expectedPackageFiles = [
  "00_START_HERE_Athena_Customer_Discovery_Workspace.docx",
  "01_Athena_Research_Journey_and_Decision_Trail.docx",
  "02_Athena_Customer_and_GTM_Options.docx",
  "03_Athena_Evidence_Register_and_Source_Guide.docx",
  "04_Source_Institutional_Intelligence_Assessment.txt",
  "05_Source_UL_Lafayette_Student_Advising_Validation.txt",
  "06_Source_Know_Your_Next_Move.txt"
];

for (const filename of expectedPackageFiles) {
  if (!existsSync(resolve(root, "athena_package", filename))) {
    fail(`research package file is missing: ${filename}`);
  }
}

if (failures.length) {
  console.error("Athena validation failed:");
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log("Athena validation passed");
console.log(`- ${anchors.length} internal navigation links`);
console.log(`- ${localHrefs.length} local document links`);
console.log(`- ${expectedPackageFiles.length} required research files`);
console.log(`- ${scripts.length} inline application script`);
