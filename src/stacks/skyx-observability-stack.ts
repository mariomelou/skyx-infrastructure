import * as cdk from "aws-cdk-lib";
import * as cloudwatch from "aws-cdk-lib/aws-cloudwatch";
import * as cloudwatchActions from "aws-cdk-lib/aws-cloudwatch-actions";
import * as sns from "aws-cdk-lib/aws-sns";
import { Construct } from "constructs";
import { skyxProduction } from "../config/skyx-prod.js";

export interface SkyxObservabilityStackProps extends cdk.StackProps {
  alarmTopicArn: string;
  elb5xxThreshold: number;
  rdsConnectionsThreshold: number;
}

/**
 * Opt-in alarms for already-owned SkyX production resources.
 *
 * This stack deliberately creates no ECS, ELB, RDS, SNS, or application
 * resources. It only references their inventory identifiers and publishes
 * alarm notifications to an explicitly supplied SNS topic.
 */
export class SkyxObservabilityStack extends cdk.Stack {
  public constructor(
    scope: Construct,
    id: string,
    props: SkyxObservabilityStackProps,
  ) {
    super(scope, id, props);

    cdk.Tags.of(this).add("Application", "SkyX");
    cdk.Tags.of(this).add("ManagedBy", "AWS-CDK");
    cdk.Tags.of(this).add("HardeningMode", "opt-in-observability");

    const alarmTopic = sns.Topic.fromTopicArn(
      this,
      "AlarmTopic",
      props.alarmTopicArn,
    );
    const alarmAction = new cloudwatchActions.SnsAction(alarmTopic);

    this.createAlarm(
      "ApiUnhealthyHostCountAlarm",
      "skyx-prod-api-unhealthy-host-count",
      new cloudwatch.Metric({
        namespace: "AWS/ApplicationELB",
        metricName: "UnHealthyHostCount",
        dimensionsMap: {
          LoadBalancer: this.loadBalancerDimension(
            skyxProduction.loadBalancers.api.arn,
          ),
          TargetGroup: this.targetGroupDimension(
            skyxProduction.loadBalancers.api.targetGroupArn,
          ),
        },
        period: cdk.Duration.minutes(1),
        statistic: "Maximum",
      }),
      1,
      alarmAction,
      "Alarm when the SkyX API target group has at least one unhealthy target.",
    );

    this.createAlarm(
      "FrontendUnhealthyHostCountAlarm",
      "skyx-prod-frontend-unhealthy-host-count",
      new cloudwatch.Metric({
        namespace: "AWS/ApplicationELB",
        metricName: "UnHealthyHostCount",
        dimensionsMap: {
          LoadBalancer: this.loadBalancerDimension(
            skyxProduction.loadBalancers.frontend.arn,
          ),
          TargetGroup: this.targetGroupDimension(
            skyxProduction.loadBalancers.frontend.targetGroupArn,
          ),
        },
        period: cdk.Duration.minutes(1),
        statistic: "Maximum",
      }),
      1,
      alarmAction,
      "Alarm when the SkyX frontend target group has at least one unhealthy target.",
    );

    this.createAlarm(
      "ApiElb5xxAlarm",
      "skyx-prod-api-elb-5xx",
      new cloudwatch.Metric({
        namespace: "AWS/ApplicationELB",
        metricName: "HTTPCode_ELB_5XX_Count",
        dimensionsMap: {
          LoadBalancer: this.loadBalancerDimension(
            skyxProduction.loadBalancers.api.arn,
          ),
        },
        period: cdk.Duration.minutes(5),
        statistic: "Sum",
      }),
      props.elb5xxThreshold,
      alarmAction,
      "Alarm when the API ALB emits the approved five-minute 5XX threshold.",
    );

    this.createAlarm(
      "FrontendElb5xxAlarm",
      "skyx-prod-frontend-elb-5xx",
      new cloudwatch.Metric({
        namespace: "AWS/ApplicationELB",
        metricName: "HTTPCode_ELB_5XX_Count",
        dimensionsMap: {
          LoadBalancer: this.loadBalancerDimension(
            skyxProduction.loadBalancers.frontend.arn,
          ),
        },
        period: cdk.Duration.minutes(5),
        statistic: "Sum",
      }),
      props.elb5xxThreshold,
      alarmAction,
      "Alarm when the frontend ALB emits the approved five-minute 5XX threshold.",
    );

    this.createAlarm(
      "ApiRunningTaskCountAlarm",
      "skyx-prod-api-running-task-count",
      this.ecsServiceMetric("skyx-api", "RunningTaskCount", "Minimum"),
      1,
      alarmAction,
      "Alarm when the API service has no running task.",
      cloudwatch.ComparisonOperator.LESS_THAN_THRESHOLD,
    );

    this.createAlarm(
      "FrontendRunningTaskCountAlarm",
      "skyx-prod-frontend-running-task-count",
      this.ecsServiceMetric(
        "skyx-frontend",
        "RunningTaskCount",
        "Minimum",
      ),
      1,
      alarmAction,
      "Alarm when the frontend service has no running task.",
      cloudwatch.ComparisonOperator.LESS_THAN_THRESHOLD,
    );

    this.createAlarm(
      "AuroraDatabaseConnectionsAlarm",
      "skyx-prod-aurora-database-connections",
      new cloudwatch.Metric({
        namespace: "AWS/RDS",
        metricName: "DatabaseConnections",
        dimensionsMap: {
          DBClusterIdentifier: skyxProduction.database.clusterIdentifier,
        },
        period: cdk.Duration.minutes(5),
        statistic: "Maximum",
      }),
      props.rdsConnectionsThreshold,
      alarmAction,
      "Alarm when Aurora connections exceed the explicitly approved threshold.",
    );
  }

  private createAlarm(
    id: string,
    alarmName: string,
    metric: cloudwatch.Metric,
    threshold: number,
    alarmAction: cloudwatchActions.SnsAction,
    description: string,
    comparisonOperator: cloudwatch.ComparisonOperator =
      cloudwatch.ComparisonOperator.GREATER_THAN_OR_EQUAL_TO_THRESHOLD,
  ): void {
    const alarm = new cloudwatch.Alarm(this, id, {
      alarmName,
      alarmDescription: description,
      metric,
      threshold,
      evaluationPeriods: 3,
      datapointsToAlarm: 2,
      comparisonOperator,
      treatMissingData: cloudwatch.TreatMissingData.BREACHING,
    });
    alarm.addAlarmAction(alarmAction);
  }

  private ecsServiceMetric(
    serviceName: string,
    metricName: string,
    statistic: string,
  ): cloudwatch.Metric {
    return new cloudwatch.Metric({
      namespace: "AWS/ECS",
      metricName,
      dimensionsMap: {
        ClusterName: skyxProduction.ecs.clusterName,
        ServiceName: serviceName,
      },
      period: cdk.Duration.minutes(1),
      statistic,
    });
  }

  private loadBalancerDimension(arn: string): string {
    return arn.split(":loadbalancer/")[1] ?? arn;
  }

  private targetGroupDimension(arn: string): string {
    return arn.split(":targetgroup/")[1] ?? arn;
  }
}
