import * as cdk from "aws-cdk-lib";
import * as logs from "aws-cdk-lib/aws-logs";
import { Construct } from "constructs";
import { skyxProduction } from "../config/skyx-prod.js";

export interface SkyxLogRetentionStackProps extends cdk.StackProps {
  retentionDays: number;
}

/**
 * Import-oriented retention template for the existing ECS log groups.
 *
 * The log groups already exist outside CloudFormation. This stack is therefore
 * never a generic create/deploy target: it must be reviewed as an import or a
 * separately approved property update, with retention and retain policies
 * visible in the generated template.
 */
export class SkyxLogRetentionStack extends cdk.Stack {
  public constructor(
    scope: Construct,
    id: string,
    props: SkyxLogRetentionStackProps,
  ) {
    super(scope, id, props);

    cdk.Tags.of(this).add("Application", "SkyX");
    cdk.Tags.of(this).add("ManagedBy", "AWS-CDK");
    cdk.Tags.of(this).add("HardeningMode", "import-oriented-log-retention");

    this.createLogGroup("ApiLogGroup", skyxProduction.ecs.api.logGroup, props.retentionDays);
    this.createLogGroup(
      "FrontendLogGroup",
      skyxProduction.ecs.frontend.logGroup,
      props.retentionDays,
    );
  }

  private createLogGroup(id: string, logGroupName: string, retentionDays: number): void {
    const logGroup = new logs.CfnLogGroup(this, id, {
      logGroupName,
      retentionInDays: retentionDays,
    });
    logGroup.cfnOptions.deletionPolicy = cdk.CfnDeletionPolicy.RETAIN;
    logGroup.cfnOptions.updateReplacePolicy = cdk.CfnDeletionPolicy.RETAIN;
  }
}
