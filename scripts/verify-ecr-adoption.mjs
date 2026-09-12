import { readFile } from "node:fs/promises";

const templatePath = "cdk.out/SkyxEcrAdoption.template.json";
const template = JSON.parse(await readFile(templatePath, "utf8"));
const resources = template.Resources ?? {};
const repository = resources.Repository;

const fail = (message) => {
  throw new Error(`ECR adoption template invalid: ${message}`);
};

if (!repository || repository.Type !== "AWS::ECR::Repository") {
  fail("Repository must be exactly one AWS::ECR::Repository resource");
}

const applicationResources = Object.entries(resources).filter(
  ([logicalId, resource]) =>
    logicalId !== "CDKMetadata" && resource.Type !== "AWS::CDK::Metadata",
);
if (applicationResources.length !== 1) {
  fail("unexpected application resources are present");
}

const properties = repository.Properties ?? {};
if (properties.RepositoryName !== "skyx-backend") {
  fail("RepositoryName must be skyx-backend for wave 1");
}
if (properties.ImageTagMutability !== "MUTABLE") {
  fail("ImageTagMutability must remain MUTABLE");
}
if (properties.ImageScanningConfiguration?.ScanOnPush !== true) {
  fail("ScanOnPush must remain true");
}
if (properties.EncryptionConfiguration?.EncryptionType !== "AES256") {
  fail("encryption must remain AES256");
}
for (const property of ["LifecyclePolicy", "RepositoryPolicyText", "Tags"]) {
  if (property in properties) {
    fail(`${property} must not be introduced by the adoption component`);
  }
}
if (
  repository.DeletionPolicy !== "Retain" ||
  repository.UpdateReplacePolicy !== "Retain"
) {
  fail("DeletionPolicy and UpdateReplacePolicy must both be Retain");
}

console.log(
  "ECR adoption template verified: one retained skyx-backend repository, no policy/lifecycle/tag mutation",
);
