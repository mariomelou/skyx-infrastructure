import fs from "node:fs";

const readJson = (path) => JSON.parse(fs.readFileSync(path, "utf8"));
const fail = (message) => {
  throw new Error(`IaC safety gate failed: ${message}`);
};
const assert = (condition, message) => {
  if (!condition) fail(message);
};

const deployPolicy = readJson("config/iam/skyx-iac-deploy-role-policy.json");
const previewPolicy = readJson("config/iam/skyx-iac-preview-role-policy.json");
const trustPolicy = readJson("config/iam/skyx-iac-deploy-role-trust.json");
const workflow = fs.readFileSync(".github/workflows/iac.yml", "utf8");
const pendingMatrix = fs.readFileSync("docs/pending-matrix-2026-09-12.md", "utf8");
const hardeningPlan = fs.readFileSync("docs/hardening-plan-2026-09-12.md", "utf8");
const defaultTemplate = readJson("cdk.out/SkyxAdoption.template.json");

const actions = (policy) =>
  [...new Set(
    policy.Statement.flatMap((statement) =>
      Array.isArray(statement.Action) ? statement.Action : [statement.Action],
    ),
  )].sort();

const deployActions = actions(deployPolicy);
const forbiddenDeployActions = [
  "cloudformation:CreateStack",
  "cloudformation:UpdateStack",
  "ecr:PutImage",
  "iam:PassRole",
  "iam:CreateRole",
  "iam:AttachRolePolicy",
  "iam:PutRolePolicy",
];
assert(
  forbiddenDeployActions.every((action) => !deployActions.includes(action)),
  `deploy policy contains a forbidden action: ${forbiddenDeployActions.find((action) => deployActions.includes(action))}`,
);
assert(
  deployActions.includes("cloudformation:CreateChangeSet") &&
    deployActions.includes("cloudformation:ExecuteChangeSet"),
  "deploy policy must support only the reviewed change-set path",
);
assert(
  JSON.stringify(deployPolicy).includes("AWS::ECR::Repository") &&
    JSON.stringify(deployPolicy).includes("skyx-ecr-*"),
  "deploy policy is not constrained to the first ECR import boundary",
);

const previewResources = previewPolicy.Statement.flatMap((statement) => {
  const resource = statement.Resource;
  return Array.isArray(resource) ? resource : [resource];
});
for (const stack of [
  "SkyxAdoption",
  "SkyxEcrAdoption",
  "SkyxObservability",
  "SkyxEcsScaling",
  "SkyxWaf",
  "SkyxLogRetention",
]) {
  assert(
    previewResources.some((resource) => resource.endsWith(`stack/${stack}/*`)),
    `preview policy is missing ${stack} readback scope`,
  );
}

const trustJson = JSON.stringify(trustPolicy);
assert(
  trustJson.includes("repo:melou-ai/skyx-infrastructure:environment:production"),
  "deploy trust must be bound to the protected production environment",
);
assert(
  trustJson.includes("token.actions.githubusercontent.com:aud") &&
    trustJson.includes("sts.amazonaws.com"),
  "deploy trust must constrain the OIDC audience",
);

for (const required of [
  "environment: production",
  "AWS_IAC_DEPLOY_ROLE_ARN",
  "AWS_IAC_IMPORT_ENABLED",
  "aws cloudformation execute-change-set",
  "inputs.hardening_component != 'none'",
  "129346407469",
]) {
  assert(workflow.includes(required), `workflow is missing safety gate '${required}'`);
}

const defaultResources = Object.values(defaultTemplate.Resources ?? {});
assert(
  defaultResources.every((resource) => resource.Type === "AWS::CDK::Metadata"),
  "default adoption template contains an application resource",
);
for (const token of ["PROVADO", "PENDENTE", "BLOQUEADO", "explicit approval"]) {
  assert(
    pendingMatrix.includes(token) || hardeningPlan.includes(token),
    `audit documentation is missing state/gate token '${token}'`,
  );
}

console.log(
  "IaC safety gates verified: default manifest non-owning, deploy role constrained, preview scopes explicit, OIDC/environment guard present, and audit states documented",
);
