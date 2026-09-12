import * as cdk from "aws-cdk-lib";
import { skyxProduction } from "./config/skyx-prod.js";
import { SkyxAdoptionStack } from "./stacks/skyx-adoption-stack.js";

const app = new cdk.App();

new SkyxAdoptionStack(app, "SkyxAdoption", {
  env: {
    account: skyxProduction.accountId,
    region: skyxProduction.region,
  },
  description:
    "Non-owning SkyX production inventory and adoption manifest; no existing resources are recreated by this stack.",
});
