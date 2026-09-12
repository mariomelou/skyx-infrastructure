# SkyX ECS deployment circuit breaker design — 2026-09-12

## Status

`DESENHADO / NÃO APLICADO`. The current services are externally owned and the full ECS service property set is not yet represented in an owning CloudFormation stack. No service update or deployment was performed.

## Current evidence

Read-only `ecs describe-services` evidence for cluster `skyx-prod` shows:

| Service | Desired/running | Deployment controller | Circuit breaker | Rollout settings | Task definition |
| --- | --- | --- | --- | --- | --- |
| `skyx-api` | `1/1` | `ECS` | `enable=false`, `rollback=false` | `ROLLING`, `maximumPercent=200`, `minimumHealthyPercent=100` | `skyx-api:4` |
| `skyx-frontend` | `1/1` | `ECS` | `enable=false`, `rollback=false` | `ROLLING`, `maximumPercent=200`, `minimumHealthyPercent=100` | `skyx-frontend:1` |

Both services have no deployment alarm configuration. Backend migrations remain owned by the backend release workflow and must not be coupled to this change.

## Controlled change

The reviewed target is to preserve the existing controller, task definition, rollout percentages, health checks, and load balancers while changing only the deployment circuit-breaker behavior to `enable=true` and `rollback=true`. This requires either a complete resource-by-resource ECS service import followed by an update, or an explicitly approved service update that is then captured in IaC. A partial `AWS::ECS::Service` template is not acceptable because it could reset properties or recreate runtime associations.

Before approval, capture the complete service snapshot, task-definition and target-group health, failure signal, maintenance window, and rollback command/change set. Do not combine this update with autoscaling, listeners, security groups, or migrations.

## Gate

The change remains `PENDENTE / AGUARDANDO APROVAÇÃO`. It requires a complete service diff, failure rehearsal, rollback plan, protected GitHub environment, and explicit approval. The current workflow intentionally rejects generic deployment for hardening components.
