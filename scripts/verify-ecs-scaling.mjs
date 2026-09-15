import fs from "node:fs";

const templatePath = "cdk.out/SkyxEcsScaling.template.json";
const template = JSON.parse(fs.readFileSync(templatePath, "utf8"));
const resources = Object.values(template.Resources ?? {});
const scalableTargets = resources.filter(
  (resource) => resource.Type === "AWS::ApplicationAutoScaling::ScalableTarget",
);
const scalingPolicies = resources.filter(
  (resource) => resource.Type === "AWS::ApplicationAutoScaling::ScalingPolicy",
);
const forbiddenTypes = new Set([
  "AWS::ECS::Service",
  "AWS::IAM::Role",
  "AWS::ApplicationAutoScaling::ScheduledAction",
]);

if (scalableTargets.length !== 2 || scalingPolicies.length !== 2) {
  throw new Error(
    `Expected two scalable targets and two policies; found ${scalableTargets.length} targets and ${scalingPolicies.length} policies`,
  );
}

for (const resource of resources) {
  if (forbiddenTypes.has(resource.Type)) {
    throw new Error(`ECS scaling template must not create ${resource.Type}`);
  }
}

const targetResourceIds = new Set(
  scalableTargets.map((resource) => resource.Properties?.ResourceId),
);
for (const resourceId of [
  "service/skyx-prod/skyx-api",
  "service/skyx-prod/skyx-frontend",
]) {
  if (!targetResourceIds.has(resourceId)) {
    throw new Error(`Missing scalable target for ${resourceId}`);
  }
}

const policyNames = new Set(scalingPolicies.map((policy) => policy.Properties?.PolicyName));
for (const expectedName of ["skyx-api-cpu-60", "skyx-frontend-cpu-60"]) {
  if (!policyNames.has(expectedName)) {
    throw new Error(`Missing live ECS target-tracking policy name ${expectedName}`);
  }
}

for (const policy of scalingPolicies) {
  const properties = policy.Properties ?? {};
  const tracking = properties.TargetTrackingScalingPolicyConfiguration;
  if (
    properties.PolicyType !== "TargetTrackingScaling" ||
    tracking?.PredefinedMetricSpecification?.PredefinedMetricType !==
      "ECSServiceAverageCPUUtilization" ||
    tracking?.ScaleOutCooldown !== 60 ||
    tracking?.ScaleInCooldown !== 300
  ) {
    throw new Error("ECS scaling policy drifted from the reviewed CPU target-tracking design");
  }
}

console.log(
  "ECS scaling template verified: two existing-service targets and two CPU policies, no ECS service or IAM role ownership",
);
