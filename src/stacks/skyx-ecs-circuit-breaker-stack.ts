import * as cdk from "aws-cdk-lib";
import * as ecs from "aws-cdk-lib/aws-ecs";
import { Construct } from "constructs";
import { skyxProduction } from "../config/skyx-prod.js";

/** Import-oriented deployment configuration for the existing ECS services. */
export class SkyxEcsCircuitBreakerStack extends cdk.Stack {
  public constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    cdk.Tags.of(this).add("Application", "SkyX");
    cdk.Tags.of(this).add("ManagedBy", "AWS-CDK");
    cdk.Tags.of(this).add("HardeningMode", "import-oriented-ecs-circuit-breaker");

    this.createService("ApiService", skyxProduction.ecs.api.serviceName);
    this.createService("FrontendService", skyxProduction.ecs.frontend.serviceName);
  }

  private createService(id: string, serviceName: string): void {
    const service = new ecs.CfnService(this, id, {
      cluster: skyxProduction.ecs.clusterName,
      serviceName,
      deploymentConfiguration: {
        deploymentCircuitBreaker: { enable: true, rollback: true },
      },
    });
    service.cfnOptions.deletionPolicy = cdk.CfnDeletionPolicy.RETAIN;
    service.cfnOptions.updateReplacePolicy = cdk.CfnDeletionPolicy.RETAIN;
  }
}
