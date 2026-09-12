import { execFileSync } from "node:child_process";

const repository = "repos/melou-ai/skyx-infrastructure";
const environment = `${repository}/environments/production`;
const expectedReviewerIds = new Set([65774721, 40343851]);

function ghApi(path, ...args) {
  return JSON.parse(
    execFileSync("gh", ["api", path, ...args], {
      encoding: "utf8",
      stdio: ["ignore", "pipe", "pipe"],
    }),
  );
}

function collectIds(value, ids = new Set()) {
  if (Array.isArray(value)) {
    for (const item of value) collectIds(item, ids);
  } else if (value && typeof value === "object") {
    if (typeof value.id === "number") ids.add(value.id);
    for (const item of Object.values(value)) collectIds(item, ids);
  }
  return ids;
}

function fail(message) {
  console.error(`PRODUCTION_GATE_BLOCKED: ${message}`);
  process.exitCode = 2;
}

let environmentState;
try {
  environmentState = ghApi(environment);
} catch {
  fail("environment production is absent or the current token cannot read it");
  process.exit();
}

const branchPolicy = environmentState.deployment_branch_policy ?? {};
if (branchPolicy.protected_branches !== false || branchPolicy.custom_branch_policies !== true) {
  fail("production must use custom branch policies with protected_branches=false");
}

const protectionRules = environmentState.protection_rules ?? [];
const reviewerIds = collectIds(protectionRules);
for (const id of expectedReviewerIds) {
  if (!reviewerIds.has(id)) fail(`required reviewer ${id} is missing`);
}

let branchPolicies;
try {
  branchPolicies = ghApi(`${environment}/deployment-branch-policies`).branch_policies ?? [];
} catch {
  fail("deployment branch policy list is unavailable");
  branchPolicies = [];
}
if (!branchPolicies.some((policy) => policy.name === "main" && policy.type === "branch")) {
  fail("custom deployment branch policy main is missing");
}

let environmentSecrets;
try {
  environmentSecrets = ghApi(`${environment}/secrets`).secrets ?? [];
} catch {
  fail("environment secret list is unavailable");
  environmentSecrets = [];
}
if (!environmentSecrets.some((secret) => secret.name === "AWS_IAC_DEPLOY_ROLE_ARN")) {
  fail("AWS_IAC_DEPLOY_ROLE_ARN environment secret is missing");
}

let importVariable;
try {
  importVariable = ghApi(`${repository}/actions/variables/AWS_IAC_IMPORT_ENABLED`);
} catch {
  fail("AWS_IAC_IMPORT_ENABLED repository variable is missing");
}
if (importVariable?.value !== "true") {
  fail("AWS_IAC_IMPORT_ENABLED must be exactly true");
}

if (process.exitCode !== 2) {
  console.log(
    "PRODUCTION_GATE_VERIFIED: protected production environment, required reviewers, main branch policy, deploy-role secret, and import variable are present",
  );
}
