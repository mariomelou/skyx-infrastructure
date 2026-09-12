import fs from "node:fs";

const expectedRetentionDays = 30;
const template = JSON.parse(
  fs.readFileSync("cdk.out/SkyxLogRetention.template.json", "utf8"),
);
const resources = Object.values(template.Resources ?? {});
const logGroups = resources.filter((resource) => resource.Type === "AWS::Logs::LogGroup");
const forbiddenTypes = new Set([
  "AWS::ECS::Service",
  "AWS::RDS::DBCluster",
  "AWS::Logs::Destination",
]);

if (logGroups.length !== 2) {
  throw new Error(`Expected two existing ECS log groups, found ${logGroups.length}`);
}

for (const resource of resources) {
  if (forbiddenTypes.has(resource.Type)) {
    throw new Error(`Log-retention template must not create ${resource.Type}`);
  }
  if (
    resource.Type === "AWS::Logs::LogGroup" &&
    (resource.DeletionPolicy !== "Retain" || resource.UpdateReplacePolicy !== "Retain")
  ) {
    throw new Error("Every log group must retain data on removal or replacement");
  }
}

const names = new Set(logGroups.map((resource) => resource.Properties?.LogGroupName));
for (const name of ["/ecs/skyx-api", "/ecs/skyx-frontend"]) {
  if (!names.has(name)) {
    throw new Error(`Missing expected log group ${name}`);
  }
}

for (const resource of logGroups) {
  if (resource.Properties?.RetentionInDays !== expectedRetentionDays) {
    throw new Error(`Expected the local review input to use ${expectedRetentionDays} days`);
  }
}

console.log(
  `Log-retention template verified: two retained ECS log groups with ${expectedRetentionDays}-day review input; no ECS service or database ownership`,
);
