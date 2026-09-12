import { readFile } from "node:fs/promises";
import { resolve } from "node:path";

const templatePath = resolve("cdk.out", "SkyxAdoption.template.json");
const template = JSON.parse(await readFile(templatePath, "utf8"));
const resources = Object.entries(template.Resources ?? {});
const applicationResources = resources.filter(
  ([, resource]) => resource.Type !== "AWS::CDK::Metadata",
);

if (applicationResources.length > 0) {
  const details = applicationResources
    .map(([logicalId, resource]) => `${logicalId}=${resource.Type}`)
    .join(", ");
  throw new Error(
    `Reference-only adoption manifest declares application resources: ${details}`,
  );
}

const requiredOutputs = [
  "AccountId",
  "Region",
  "VpcId",
  "ClusterName",
  "ApiServiceArn",
  "FrontendServiceArn",
  "DatabaseClusterArn",
  "CognitoUserPoolId",
];
const missingOutputs = requiredOutputs.filter(
  (outputName) => !template.Outputs?.[outputName],
);

if (missingOutputs.length > 0) {
  throw new Error(
    `Reference-only adoption manifest is missing outputs: ${missingOutputs.join(", ")}`,
  );
}

console.log(
  `adoption manifest verified: ${resources.length} metadata resource, ${requiredOutputs.length} critical outputs, no application resources`,
);
