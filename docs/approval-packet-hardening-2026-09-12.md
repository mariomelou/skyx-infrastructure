# Approval packet — SkyX production hardening — 2026-09-12

## Status

`PENDENTE / AGUARDANDO APROVAÇÃO`. The four opt-in templates pass local verification, but no hardening component has been deployed or imported. A read-only AWS recheck on 2026-09-15 found zero SNS topics in `us-east-1`, so observability still lacks an approved notification destination.

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

## Current revalidation — 2026-09-15

- Rendered template hashes and resource counts: `SkyxObservability` `1ffe31187c3305072288f6da1bdd32b2651441e61d8a51193edf1423d261cae1` (7 alarms); `SkyxEcsScaling` `f5f4bab263c7692d5df37900597576f6acbfe1cb823885090f7f6892e81b1cd1` (2 scalable targets and 2 policies); `SkyxWaf` `3a3b7ef5ba5f21f558100ab68770782fc69259ae4cf457cd08f5986f967869ca` (1 Web ACL and 2 associations); `SkyxLogRetention` `ec618ce87911a9465564ab7f54161f973b59cab1d0ecbc6e43524293a43c7fd1` (2 log groups).
- `SkyxObservability`: local template verified with seven alarms, but the proposed `arn:aws:sns:us-east-1:129346407469:skyx-alerts` topic does not exist; no topic was created because notification ownership/subscriptions were not approved.
- `SkyxEcsScaling`: local template verified for API `1–4` / CPU `60%` and frontend `1–3` / CPU `60%`; no ECS service or IAM role ownership is included.
- `SkyxWaf`: local template verified for one regional Web ACL in `COUNT` mode and two existing ALB associations; no blocking or logging configuration is included.
- `SkyxLogRetention`: local template verified for both existing ECS log groups at `30` days with `Retain` policies; the import/update remains approval-gated.
- No hardening change set was created or executed, and Cognito remains intentionally out of scope for this wave.

## Approval checklist

Before execution, record all of the following for exactly one component:

1. Approved component and exact input values.
2. Local verifier output and rendered CloudFormation template hash.
3. Authenticated `cdk diff --method template` with no unexpected replacement/deletion.
4. Change-set ARN, expected action/resource count, and resource-by-resource mapping.
5. Maintenance window, owner, rollback procedure, and post-change checks.
6. Explicit approval for execution after the diff is shown.

The import/deploy workflow must run only from `main`, through the protected `production` environment, with the scoped `SkyXIacDeployRole`. Backend migrations remain owned by the backend release workflow.
