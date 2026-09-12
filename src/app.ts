import * as cdk from "aws-cdk-lib";
import { skyxProduction } from "./config/skyx-prod.js";
import { SkyxAdoptionStack } from "./stacks/skyx-adoption-stack.js";
import {
  ecrAdoptionRepositoryNames,
  SkyxEcrAdoptionStack,
  type EcrAdoptionRepositoryName,
} from "./stacks/skyx-ecr-adoption-stack.js";

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
