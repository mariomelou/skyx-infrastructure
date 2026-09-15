import fs from "node:fs";

const template = JSON.parse(
  fs.readFileSync("cdk.out/SkyxWaf.template.json", "utf8"),
);
const resources = Object.values(template.Resources ?? {});
const webAcls = resources.filter((resource) => resource.Type === "AWS::WAFv2::WebACL");
const associations = resources.filter(
  (resource) => resource.Type === "AWS::WAFv2::WebACLAssociation",
);
const forbiddenTypes = new Set([
  "AWS::WAFRegional::WebACL",
  "AWS::WAFv2::LoggingConfiguration",
  "AWS::ElasticLoadBalancingV2::LoadBalancer",
]);

if (webAcls.length !== 1 || associations.length !== 2) {
  throw new Error(
    `Expected one WAFv2 WebACL and two associations; found ${webAcls.length} WebACLs and ${associations.length} associations`,
  );
}

for (const resource of resources) {
  if (forbiddenTypes.has(resource.Type)) {
    throw new Error(`WAF template must not create ${resource.Type}`);
  }
}

const webAcl = webAcls[0].Properties ?? {};
if (
  webAcl.Scope !== "REGIONAL" ||
  webAcl.DefaultAction?.Allow === undefined ||
  webAcl.Rules?.length !== 2 ||
  webAcl.VisibilityConfig?.MetricName !== "skyxProdRegionalCount"
) {
  throw new Error("WAF template drifted from the regional allow/count design");
}

for (const rule of webAcl.Rules) {
  if (
    rule.OverrideAction?.Count === undefined ||
    rule.Name !== `AWS-${rule.Statement.ManagedRuleGroupStatement.Name}` ||
    rule.Statement?.ManagedRuleGroupStatement?.VendorName !== "AWS" ||
    !/^AWSManagedRules(CommonRuleSet|KnownBadInputsRuleSet)$/.test(
      rule.Statement.ManagedRuleGroupStatement.Name,
    )
  ) {
    throw new Error("Every WAF rule must be an AWS managed rule group in COUNT mode");
  }
}

const ruleMetricNames = new Set(webAcl.Rules.map((rule) => rule.VisibilityConfig?.MetricName));
for (const expectedName of [
  "AWS-AWSManagedRulesCommonRuleSet",
  "AWS-AWSManagedRulesKnownBadInputsRuleSet",
]) {
  if (!ruleMetricNames.has(expectedName)) {
    throw new Error(`Missing live WAF metric name ${expectedName}`);
  }
}

const associationArns = new Set(
  associations.map((resource) => resource.Properties?.ResourceArn),
);
for (const arn of [
  "arn:aws:elasticloadbalancing:us-east-1:129346407469:loadbalancer/app/skyx-prod-alb/daa606ab7cfc22fc",
  "arn:aws:elasticloadbalancing:us-east-1:129346407469:loadbalancer/app/skyx-prod-frontend-alb/7841fca276b64cd7",
]) {
  if (!associationArns.has(arn)) {
    throw new Error(`Missing WAF association for ${arn}`);
  }
}

console.log(
  "WAF template verified: one regional COUNT WebACL, two existing-ALB associations, no logging or ALB ownership",
);
