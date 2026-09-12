# SkyX observability component design — 2026-09-12

## Status

`PREPARADO / NÃO APLICADO`. This is an opt-in CDK component intended for review while the protected GitHub environment is still awaiting repository-admin access. No CloudWatch alarm has been deployed by this component.

## Ownership boundary

`SkyxObservability` creates only `AWS::CloudWatch::Alarm` resources. It references the existing ALBs, target groups, ECS services, and Aurora cluster from the evidence-backed production configuration. It does not create or adopt ECS, ALB, RDS, SNS, VPC, IAM application roles, or log-group resources.

The notification topic is not created by CDK. The caller must supply an SNS topic ARN in account `129346407469`, region `us-east-1`, and review its subscription/on-call ownership separately.

## Required explicit inputs

```text
hardeningComponent=observability
alarmTopicArn=arn:aws:sns:us-east-1:129346407469:<approved-topic>
elb5xxThreshold=<approved five-minute count>
rdsConnectionsThreshold=<approved maximum connection count>
```

The component rejects missing or non-positive thresholds and rejects topic ARNs from another account or region. It cannot be combined with the ECR adoption component in one synthesis.

## Alarm set

The template contains seven alarms:

- API and frontend ALB target groups: `UnHealthyHostCount >= 1`.
- API and frontend ALBs: `HTTPCode_ELB_5XX_Count` over the supplied five-minute threshold.
- API and frontend ECS services: `RunningTaskCount < 1`.
- Aurora: `DatabaseConnections` over the supplied threshold.

All alarms use three evaluation periods with two datapoints required and treat missing data as breaching. These values are design defaults and remain subject to operational review before any deployment.

## Validation and gate

```bash
npm run verify:observability
```

The verifier proves that the synthesized template contains exactly seven alarms, uses one supplied alarm topic per alarm, and creates no SNS, ECS, ALB, or RDS resources. A future deployment still requires a reviewed diff/change set, an approved alarm topic and thresholds, the protected GitHub `production` environment, and explicit approval.

The guarded GitHub validation run `34723414012` passed synthesis and authenticated template diff for this component. Its import and generic deployment jobs were skipped by design.
