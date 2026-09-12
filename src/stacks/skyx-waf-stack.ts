import * as cdk from "aws-cdk-lib";
import * as wafv2 from "aws-cdk-lib/aws-wafv2";
import { Construct } from "constructs";
import { skyxProduction } from "../config/skyx-prod.js";

export interface SkyxWafStackProps extends cdk.StackProps {
  mode: "count";
}

/**
 * Opt-in regional WAF observation for the two existing public ALBs.
 *
 * The first component intentionally supports COUNT only. It measures the
 * managed rule groups without blocking production traffic or creating a
 * logging destination whose ownership has not been approved.
 */
export class SkyxWafStack extends cdk.Stack {
  public constructor(scope: Construct, id: string, props: SkyxWafStackProps) {
    super(scope, id, props);

    if (props.mode !== "count") {
      throw new Error("The first WAF component supports COUNT mode only.");
    }

    cdk.Tags.of(this).add("Application", "SkyX");
    cdk.Tags.of(this).add("ManagedBy", "AWS-CDK");
    cdk.Tags.of(this).add("HardeningMode", "opt-in-waf-count");

    const webAcl = new wafv2.CfnWebACL(this, "RegionalWebAcl", {
      defaultAction: { allow: {} },
      name: "skyx-prod-regional-count",
      scope: "REGIONAL",
      visibilityConfig: {
        cloudWatchMetricsEnabled: true,
        metricName: "skyx-prod-regional-waf-count",
        sampledRequestsEnabled: true,
      },
      rules: [
        this.managedRule("CommonRuleSet", 0),
        this.managedRule("KnownBadInputsRuleSet", 1),
      ],
    });

    new wafv2.CfnWebACLAssociation(this, "ApiAlbAssociation", {
      resourceArn: skyxProduction.loadBalancers.api.arn,
      webAclArn: webAcl.attrArn,
    });

    new wafv2.CfnWebACLAssociation(this, "FrontendAlbAssociation", {
      resourceArn: skyxProduction.loadBalancers.frontend.arn,
      webAclArn: webAcl.attrArn,
    });
  }

  private managedRule(name: string, priority: number): wafv2.CfnWebACL.RuleProperty {
    return {
      name: `AWS-${name}`,
      overrideAction: { count: {} },
      priority,
      statement: {
        managedRuleGroupStatement: {
          name: `AWSManagedRules${name}`,
          vendorName: "AWS",
        },
      },
      visibilityConfig: {
        cloudWatchMetricsEnabled: true,
        metricName: `skyx-prod-${name.toLowerCase()}-count`,
        sampledRequestsEnabled: true,
      },
    };
  }
}
