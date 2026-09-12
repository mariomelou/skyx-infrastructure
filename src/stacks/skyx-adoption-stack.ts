import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
import { skyxProduction } from "../config/skyx-prod.js";

export class SkyxAdoptionStack extends cdk.Stack {
  public constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    cdk.Tags.of(this).add("Application", "SkyX");
    cdk.Tags.of(this).add("ManagedBy", "AWS-CDK");
    cdk.Tags.of(this).add("AdoptionMode", "reference-only");

    this.output("AccountId", skyxProduction.accountId);
    this.output("Region", skyxProduction.region);
    this.output("VpcId", skyxProduction.vpc.id);
    this.output("VpcCidr", skyxProduction.vpc.cidr);
    this.output("ClusterName", skyxProduction.ecs.clusterName);
    this.output("ApiServiceArn", skyxProduction.ecs.api.serviceArn);
    this.output("FrontendServiceArn", skyxProduction.ecs.frontend.serviceArn);
    this.output("ApiTaskDefinition", skyxProduction.ecs.api.taskDefinition);
    this.output(
      "FrontendTaskDefinition",
      skyxProduction.ecs.frontend.taskDefinition,
    );
    this.output("ApiLoadBalancerArn", skyxProduction.loadBalancers.api.arn);
    this.output(
      "FrontendLoadBalancerArn",
      skyxProduction.loadBalancers.frontend.arn,
    );
    this.output("DatabaseClusterArn", skyxProduction.database.clusterArn);
    this.output("CognitoUserPoolId", skyxProduction.identity.userPoolId);
    this.output("BackendRepository", skyxProduction.repositories.backend);
    this.output("FrontendRepository", skyxProduction.repositories.frontend);
    this.output("ApiLogGroup", skyxProduction.ecs.api.logGroup);
    this.output("FrontendLogGroup", skyxProduction.ecs.frontend.logGroup);
  }

  private output(name: string, value: string): void {
    new cdk.CfnOutput(this, name, {
      value,
      description: "Read-only reference from the 2026-09-12 SkyX inventory.",
    });
  }
}

