# SkyX direct-console drift reconciliation — 2026-09-15

This plan reconciles only settings that were explicitly approved and verified in account `129346407469`, region `us-east-1`. It does not transfer account ownership, change IAM ownership, move resources between accounts, or run database migrations.

## Components modeled

| Component | CDK entry point | Live state | Adoption boundary |
| --- | --- | --- | --- |
| Aurora protection | `SkyxAuroraProtection` | `skyx-prod-db`, deletion protection on, 30-day backups/PITR | Import/update only `AWS::RDS::DBCluster`; retain on removal/replacement; no instances or migrations |
| ECS autoscaling | `SkyxEcsScaling` | API 1–4 / CPU 60%; frontend 1–3 / CPU 60% | Import the two existing scalable targets and two target-tracking policies; policy names match `skyx-api-cpu-60` and `skyx-frontend-cpu-60` |
| ECS circuit breaker | `SkyxEcsCircuitBreaker` | Both services have enable/rollback on | Import/update only the two existing `AWS::ECS::Service` resources; retain services; do not declare task definitions, IAM roles, load balancers, or desired counts |
| WAF COUNT | `SkyxWaf` | `skyx-prod-regional-count` associated with both ALBs; both AWS managed groups COUNT; logging disabled | Import the existing Web ACL and associations; no ALB ownership, logging, paid managed groups, or blocking |

## Safety gates

1. Synthesize each component independently and run its verifier.
2. Generate an import-only or property-update change set with the exact existing physical identifiers.
3. Confirm the change set contains no `Create`, `Replace`, or `Delete` action for production data, task definitions, IAM roles, ALBs, or database instances.
4. Apply only after the protected GitHub `production` environment is available and the rendered change set is reviewed.
5. Re-run read-only AWS validation and record CloudFormation import/update events.

The implementation is modeled and locally verified in this commit. No CloudFormation import or update was executed by this reconciliation step.
