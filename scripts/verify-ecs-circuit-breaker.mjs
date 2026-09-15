import fs from "node:fs";

const template = JSON.parse(fs.readFileSync("cdk.out/SkyxEcsCircuitBreaker.template.json", "utf8"));
const resources = Object.values(template.Resources ?? {});
const services = resources.filter((resource) => resource.Type === "AWS::ECS::Service");

if (services.length !== 2) {
  throw new Error(`Expected two ECS service adoption resources; found ${services.length}`);
}

const names = new Set(services.map((resource) => resource.Properties?.ServiceName));
for (const serviceName of ["skyx-api", "skyx-frontend"]) {
  if (!names.has(serviceName)) throw new Error(`Missing circuit-breaker adoption resource for ${serviceName}`);
}

for (const service of services) {
  const breaker = service.Properties?.DeploymentConfiguration?.DeploymentCircuitBreaker;
  if (breaker?.Enable !== true || breaker?.Rollback !== true) {
    throw new Error("Every ECS service must enable circuit-breaker rollback");
  }
  if (service.DeletionPolicy !== "Retain" || service.UpdateReplacePolicy !== "Retain") {
    throw new Error("ECS service adoption resources must retain services on stack removal or replacement");
  }
}

console.log("ECS circuit-breaker template verified: two retained services with rollback enabled");
