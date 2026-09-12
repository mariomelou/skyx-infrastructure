import * as cdk from "aws-cdk-lib";
import { SkyxAdoptionStack } from "./stacks/skyx-adoption-stack.js";

const app = new cdk.App();
const account = process.env.CDK_DEFAULT_ACCOUNT;
const region = process.env.CDK_DEFAULT_REGION;

new SkyxAdoptionStack(app, "SkyxAdoption", {
  ...(account && region ? { env: { account, region } } : {}),
  description:
    "Non-owning SkyX production inventory and adoption manifest; no existing resources are recreated by this stack.",
});
