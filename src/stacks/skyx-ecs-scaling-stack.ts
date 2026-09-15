import * as cdk from "aws-cdk-lib";
import * as appscaling from "aws-cdk-lib/aws-applicationautoscaling";
import { Construct } from "constructs";
import { skyxProduction } from "../config/skyx-prod.js";

export interface EcsServiceScalingConfig {
  minCapacity: number;
  maxCapacity: number;
  targetCpuUtilization: number;
}

export interface SkyxEcsScalingStackProps extends cdk.StackProps {
  api: EcsServiceScalingConfig;
  frontend: EcsServiceScalingConfig;
}

/**
 * Opt-in Application Auto Scaling resources for the existing ECS services.
 *
 * This component intentionally does not adopt or recreate ECS services. It
 * only registers their service resource IDs with Application Auto Scaling and
 * attaches target-tracking policies after explicit capacity review.
 */
export class SkyxEcsScalingStack extends cdk.Stack {
  public constructor(
    scope: Construct,
    id: string,
    props: SkyxEcsScalingStackProps,
  ) {
    super(scope, id, props);

    cdk.Tags.of(this).add("Application", "SkyX");
    cdk.Tags.of(this).add("ManagedBy", "AWS-CDK");
    cdk.Tags.of(this).add("HardeningMode", "opt-in-ecs-scaling");

    this.createServiceScaling(
      "Api",
      skyxProduction.ecs.api.serviceName,
      props.api,
    );
    this.createServiceScaling(
      "Frontend",
      skyxProduction.ecs.frontend.serviceName,
      props.frontend,
    );
  }

  private createServiceScaling(
    prefix: string,
    serviceName: string,
    config: EcsServiceScalingConfig,
  ): void {
    const scalableTarget = new appscaling.CfnScalableTarget(
      this,
      `${prefix}ScalableTarget`,
      {
        maxCapacity: config.maxCapacity,
        minCapacity: config.minCapacity,
        resourceId: `service/${skyxProduction.ecs.clusterName}/${serviceName}`,
        scalableDimension: "ecs:service:DesiredCount",
        serviceNamespace: "ecs",
      },
    );

    new appscaling.CfnScalingPolicy(this, `${prefix}CpuScalingPolicy`, {
      policyName:
        serviceName === "skyx-api" ? "skyx-api-cpu-60" : "skyx-frontend-cpu-60",
      policyType: "TargetTrackingScaling",
      scalingTargetId: scalableTarget.ref,
      serviceNamespace: "ecs",
      targetTrackingScalingPolicyConfiguration: {
        predefinedMetricSpecification: {
          predefinedMetricType: "ECSServiceAverageCPUUtilization",
        },
        scaleInCooldown: 300,
        scaleOutCooldown: 60,
        targetValue: config.targetCpuUtilization,
      },
    });
  }
}
