import fs from "node:fs";

const templatePath = "cdk.out/SkyxObservability.template.json";
const template = JSON.parse(fs.readFileSync(templatePath, "utf8"));
const resources = Object.values(template.Resources ?? {});
const alarms = resources.filter(
  (resource) => resource.Type === "AWS::CloudWatch::Alarm",
);
const forbiddenTypes = new Set([
  "AWS::SNS::Topic",
  "AWS::ECS::Service",
  "AWS::ElasticLoadBalancingV2::LoadBalancer",
  "AWS::ElasticLoadBalancingV2::Listener",
  "AWS::RDS::DBCluster",
]);

const expectedNames = new Set([
  "skyx-prod-api-unhealthy-host-count",
  "skyx-prod-frontend-unhealthy-host-count",
  "skyx-prod-api-elb-5xx",
  "skyx-prod-frontend-elb-5xx",
  "skyx-prod-api-running-task-count",
  "skyx-prod-frontend-running-task-count",
  "skyx-prod-aurora-database-connections",
]);

if (alarms.length !== expectedNames.size) {
  throw new Error(`Expected ${expectedNames.size} alarms, found ${alarms.length}`);
}

const actualNames = new Set(
  alarms.map((resource) => resource.Properties?.AlarmName),
);
for (const name of expectedNames) {
  if (!actualNames.has(name)) {
    throw new Error(`Missing expected alarm ${name}`);
  }
}

for (const resource of resources) {
  if (forbiddenTypes.has(resource.Type)) {
    throw new Error(`Observability template must not create ${resource.Type}`);
  }
}

for (const alarm of alarms) {
  const properties = alarm.Properties ?? {};
  if (properties.ActionsEnabled === false) {
    throw new Error("Every observability alarm must not disable actions");
  }
  if (!Array.isArray(properties.AlarmActions) || properties.AlarmActions.length !== 1) {
    throw new Error("Every observability alarm must use exactly one supplied SNS topic");
  }
  if (properties.EvaluationPeriods !== 3 || properties.DatapointsToAlarm !== 2) {
    throw new Error("Alarm evaluation policy drifted from 3 periods / 2 datapoints");
  }
}

for (const alarm of alarms.filter((resource) =>
  /running-task-count$/.test(resource.Properties?.AlarmName ?? ""),
)) {
  if (alarm.Properties?.ComparisonOperator !== "LessThanThreshold") {
    throw new Error("Running-task alarms must fire below the minimum task threshold");
  }
}

console.log(
  `Observability template verified: ${alarms.length} alarms, no owned SNS/ECS/ALB/RDS resources`,
);
