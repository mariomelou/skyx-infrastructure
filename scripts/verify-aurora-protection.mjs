import fs from "node:fs";

const template = JSON.parse(fs.readFileSync("cdk.out/SkyxAuroraProtection.template.json", "utf8"));
const resources = Object.values(template.Resources ?? {});
const clusters = resources.filter((resource) => resource.Type === "AWS::RDS::DBCluster");

if (clusters.length !== 1 || resources.some((resource) => resource.Type === "AWS::RDS::DBInstance")) {
  throw new Error("Aurora protection template must contain one cluster and no DB instances");
}

const properties = clusters[0].Properties ?? {};
if (
  properties.DBClusterIdentifier !== "skyx-prod-db" ||
  properties.Engine !== "aurora-postgresql" ||
  properties.EngineVersion !== "17.7" ||
  properties.BackupRetentionPeriod !== 30 ||
  properties.DeletionProtection !== true
) {
  throw new Error("Aurora protection template drifted from the approved live settings");
}

if (clusters[0].DeletionPolicy !== "Retain" || clusters[0].UpdateReplacePolicy !== "Retain") {
  throw new Error("Aurora cluster must retain data on stack removal or replacement");
}

console.log("Aurora protection template verified: retained existing cluster, 30-day backups, deletion protection");
