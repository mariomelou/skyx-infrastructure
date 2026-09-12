import * as cdk from "aws-cdk-lib";
import { skyxProduction } from "./config/skyx-prod.js";
import { SkyxAdoptionStack } from "./stacks/skyx-adoption-stack.js";
import {
  ecrAdoptionRepositoryNames,
  SkyxEcrAdoptionStack,
  type EcrAdoptionRepositoryName,
} from "./stacks/skyx-ecr-adoption-stack.js";
import { SkyxObservabilityStack } from "./stacks/skyx-observability-stack.js";

const app = new cdk.App();

new SkyxAdoptionStack(app, "SkyxAdoption", {
  env: {
    account: skyxProduction.accountId,
    region: skyxProduction.region,
  },
  description:
    "Non-owning SkyX production inventory and adoption manifest; no existing resources are recreated by this stack.",
});

const adoptionComponent = app.node.tryGetContext("adoptionComponent");
const hardeningComponent = app.node.tryGetContext("hardeningComponent");

if (adoptionComponent !== undefined && hardeningComponent !== undefined) {
  throw new Error(
    "Select one opt-in component at a time; do not combine adoption and hardening components.",
  );
}

if (adoptionComponent !== undefined && adoptionComponent !== "ecr") {
  throw new Error(
    `Unsupported adoptionComponent '${String(adoptionComponent)}'; use 'ecr'.`,
  );
}

if (adoptionComponent === "ecr") {
  const repositoryName = app.node.tryGetContext("ecrRepository");
  if (
    !ecrAdoptionRepositoryNames.includes(
      repositoryName as EcrAdoptionRepositoryName,
    )
  ) {
    throw new Error(
      `ecrRepository must be one of: ${ecrAdoptionRepositoryNames.join(", ")}.`,
    );
  }

  new SkyxEcrAdoptionStack(app, "SkyxEcrAdoption", {
    repositoryName: repositoryName as EcrAdoptionRepositoryName,
    env: {
      account: skyxProduction.accountId,
      region: skyxProduction.region,
    },
    description:
      "Opt-in staged adoption of one existing SkyX ECR repository; retain on removal or replacement.",
  });
}

if (hardeningComponent !== undefined && hardeningComponent !== "observability") {
  throw new Error(
    `Unsupported hardeningComponent '${String(hardeningComponent)}'; use 'observability'.`,
  );
}

if (hardeningComponent === "observability") {
  const alarmTopicArn = requiredContext("alarmTopicArn");
  const elb5xxThreshold = positiveIntegerContext("elb5xxThreshold");
  const rdsConnectionsThreshold = positiveIntegerContext(
    "rdsConnectionsThreshold",
  );

  if (
    !alarmTopicArn.startsWith(
      `arn:aws:sns:${skyxProduction.region}:${skyxProduction.accountId}:`,
    )
  ) {
    throw new Error(
      "alarmTopicArn must reference an SNS topic in the SkyX production account and region.",
    );
  }

  new SkyxObservabilityStack(app, "SkyxObservability", {
    alarmTopicArn,
    elb5xxThreshold,
    rdsConnectionsThreshold,
    env: {
      account: skyxProduction.accountId,
      region: skyxProduction.region,
    },
    description:
      "Opt-in CloudWatch alarms over existing SkyX resources; no application resource ownership is adopted.",
  });
}

function requiredContext(name: string): string {
  const value = app.node.tryGetContext(name);
  if (typeof value !== "string" || value.trim() === "") {
    throw new Error(`Context '${name}' is required for the observability component.`);
  }
  return value.trim();
}

function positiveIntegerContext(name: string): number {
  const value = Number(requiredContext(name));
  if (!Number.isInteger(value) || value <= 0) {
    throw new Error(`Context '${name}' must be a positive integer.`);
  }
  return value;
}
