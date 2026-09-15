import * as cdk from "aws-cdk-lib";
import * as rds from "aws-cdk-lib/aws-rds";
import { Construct } from "constructs";
import { skyxProduction } from "../config/skyx-prod.js";

/** Import-oriented protection settings for the existing Aurora cluster. */
export class SkyxAuroraProtectionStack extends cdk.Stack {
  public constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    cdk.Tags.of(this).add("Application", "SkyX");
    cdk.Tags.of(this).add("ManagedBy", "AWS-CDK");
    cdk.Tags.of(this).add("HardeningMode", "import-oriented-aurora-protection");

    const cluster = new rds.CfnDBCluster(this, "ProductionCluster", {
      backupRetentionPeriod: 30,
      dbClusterIdentifier: skyxProduction.database.clusterIdentifier,
      deletionProtection: true,
      engine: skyxProduction.database.engine,
      engineVersion: skyxProduction.database.engineVersion,
    });
    cluster.cfnOptions.deletionPolicy = cdk.CfnDeletionPolicy.RETAIN;
    cluster.cfnOptions.updateReplacePolicy = cdk.CfnDeletionPolicy.RETAIN;
  }
}
