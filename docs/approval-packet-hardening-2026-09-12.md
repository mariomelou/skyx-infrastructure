# Approval packet — SkyX production hardening — 2026-09-12

## Status

`PENDENTE / AGUARDANDO APROVAÇÃO`. This packet is a review boundary only. No hardening component has been deployed or imported.

The protected GitHub `production` environment is still absent, so no production job can run. Even after an administrator creates it, each component below requires its own reviewed diff/change set and explicit approval.

## Components ready for a reviewed change set

| Component | Inputs to approve | Expected resources | Safety boundary |
| --- | --- | --- | --- |
| `SkyxObservability` | Same-account SNS topic ARN, ALB 5XX threshold, Aurora connection threshold | Seven `AWS::CloudWatch::Alarm` resources | No SNS, ECS, ALB, RDS, or logging destination ownership |
| `SkyxEcsScaling` | API/frontend min/max capacity and CPU targets | Two `AWS::ApplicationAutoScaling::ScalableTarget` and two `ScalingPolicy` resources | No ECS service or IAM role ownership; circuit breaker remains separate |
| `SkyxWaf` | `wafMode=count` only, managed-rule observation plan | One regional `AWS::WAFv2::WebACL` and two associations | No blocking mode, logging destination, or ALB ownership |
| `SkyxLogRetention` | Accepted CloudWatch Logs retention value | Two existing ECS log-group templates with `Retain` policies | Import/update-oriented; no generic create or ECS/database ownership |

Local verifiers:

```bash
npm run verify:observability
npm run verify:ecs-scaling
npm run verify:waf
npm run verify:log-retention
```

## Still decision-gated before executable template work

- TLS/ACM/listeners: canonical hostnames, DNS ownership, certificate validation, HTTPS policy, redirects, and application URL rollout.
- Security groups/routes/VPC endpoints: dependency evidence, private-egress decision, endpoint placement/policy, cost and availability analysis.
- ECS circuit breaker: complete service snapshot, failure rehearsal, alarm/health signal, and rollback plan.
- Aurora protection: deletion-protection and backup/PITR policy, snapshot/restore evidence, complete cluster diff, and maintenance window.
- AWS Config: Control Tower owner confirmation and any rule/exception ownership.
- Application IAM/listeners: exact policy/trust/listener diff, IAM simulation, and `iam:PassRole` review if applicable.

These gates are documented in the linked design files and must not be bypassed by adding a generic deploy path.

## Approval checklist

Before execution, record all of the following for exactly one component:

1. Approved component and exact input values.
2. Local verifier output and rendered CloudFormation template hash.
3. Authenticated `cdk diff --method template` with no unexpected replacement/deletion.
4. Change-set ARN, expected action/resource count, and resource-by-resource mapping.
5. Maintenance window, owner, rollback procedure, and post-change checks.
6. Explicit approval for execution after the diff is shown.

The import/deploy workflow must run only from `main`, through the protected `production` environment, with the scoped `SkyXIacDeployRole`. Backend migrations remain owned by the backend release workflow.
