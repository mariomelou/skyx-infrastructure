# SkyX direct-console drift reconciliation — 2026-09-15

This plan reconciles only settings that were explicitly approved and verified in account `129346407469`, region `us-east-1`. It does not transfer account ownership, change IAM ownership, move resources between accounts, or run database migrations. The approved imports below were executed from the authenticated local `skyx` SSO profile after each change set was reviewed for import-only actions.

## Components modeled

| Component | CDK entry point | Live state | Adoption boundary |
| --- | --- | --- | --- |
| Aurora protection | `SkyxAuroraProtection` | `skyx-prod-db`, deletion protection on, 30-day backups/PITR | **IMPORTED** as `AWS::RDS::DBCluster` by `reconcile-20260915`; retain on removal/replacement; no instances or migrations |
| ECS autoscaling | `SkyxEcsScaling` | API 1–4 / CPU 60%; frontend 1–3 / CPU 60% | **IMPORTED** by `reconcile-20260915`: two existing scalable targets and two target-tracking policies; policy names match `skyx-api-cpu-60` and `skyx-frontend-cpu-60` |
| ECS circuit breaker | `SkyxEcsCircuitBreaker` | Both services have enable/rollback on | **IMPORTED** by `reconcile-20260915`: only the two existing `AWS::ECS::Service` resources; task definitions, IAM roles, load balancers, and desired counts remain outside this stack |
| WAF COUNT | `SkyxWaf` | `skyx-prod-regional-count` associated with both ALBs; both AWS managed groups COUNT; logging disabled | **IMPORTED** by `reconcile-20260915-acl` and `reconcile-20260915-associations-v3`: Web ACL plus both associations; no ALB ownership, logging, paid managed groups, or blocking |

## Safety gates

1. Synthesize each component independently and run its verifier.
2. Generate an import-only or property-update change set with the exact existing physical identifiers.
3. Confirm the change set contains no `Create`, `Replace`, or `Delete` action for production data, task definitions, IAM roles, ALBs, or database instances.
4. For this approved reconciliation wave, apply only after the local authenticated CLI session and rendered change set are reviewed. Future production changes should run through the protected GitHub `production` environment once its administrator setup is complete.
5. Re-run read-only AWS validation and record CloudFormation import/update events.

## Execution evidence

- `SkyxAuroraProtection`: `IMPORT_COMPLETE`; imported `ProductionCluster` for `skyx-prod-db`.
- `SkyxEcsScaling`: `IMPORT_COMPLETE`; imported both scalable targets and both CPU target-tracking policies.
- `SkyxEcsCircuitBreaker`: `IMPORT_COMPLETE`; imported `ApiService` and `FrontendService`; both services remained healthy with one running task.
- `SkyxWaf`: `IMPORT_COMPLETE`; imported `RegionalWebAcl`, `ApiAlbAssociation`, and `FrontendAlbAssociation`. The first two association attempts were rejected/rolled back without changing the live associations; the successful v3 import used the exact live frontend ALB ARN.
- No executed change set contained `Create`, `Replace`, or `Delete` actions for these resources.
