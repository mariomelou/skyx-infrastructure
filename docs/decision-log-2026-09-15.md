# SkyX hardening decision log — 2026-09-15

This record captures the user's confirmed hardening decisions and keeps unresolved production inputs explicit. Cognito is intentionally out of scope for this wave.

## Confirmed decisions

- Aurora: enable deletion protection, use 30-day backups, and enable PITR. Applied and then imported into `SkyxAuroraProtection` on 2026-09-15; the import change set contained only `ProductionCluster`.
- Application IAM ownership: keep the existing application roles externally managed; do not recreate or replace them from this repository.
- ALB listeners: adopt HTTP-to-HTTPS redirection once canonical hostnames and validated ACM certificates exist. No listener mutation is executable before those values are available.
- ECS autoscaling: API minimum/maximum `1–4` with CPU target `60%`; frontend minimum/maximum `1–3` with CPU target `60%`. Applied and imported into `SkyxEcsScaling` on 2026-09-15; the import contained the two targets and two policies only.
- WAF: start in `COUNT` mode without blocking or WAF logging; blocking and logging remain a later decision. Applied on 2026-09-15 as `skyx-prod-regional-count`, then imported into `SkyxWaf` with both existing ALB associations; both managed rule groups use `Override rule group action to count` and logging is disabled.
- AWS Config: keep recorder, delivery, and Control Tower-managed ownership external; do not recreate or modify those resources here.
- ECS deployment circuit breaker: target `enable=true` and `rollback=true`. Applied and imported into `SkyxEcsCircuitBreaker` on 2026-09-15; rollback and reset-on-healthy-task are enabled. Failure rehearsal remains a follow-up validation, not a production action.

## Pending decisions and blockers

- SNS/on-call: choose the alert topic owner, topic/subscription destination, and operational escalation channel. No SNS topic exists in `us-east-1`.
- TLS/ACM: provide canonical API/frontend hostnames, DNS ownership/validation path, and certificate ARNs or approval to request certificates.
- Network: decide whether to keep public egress or introduce private endpoints; if private, approve the service set, endpoint policy, route changes, cost owner, and availability plan.
- Alarm inputs: confirm ALB 5XX and Aurora connection thresholds, plus the notification destination.
- Log retention: confirm the exact retention period; the local template currently uses 30 days as a review input only.
- IAM/listener details: confirm any additional policy or listener changes beyond externally managed roles and HTTP-to-HTTPS redirection.
- GitHub: a repository administrator must create and protect the `production` environment and configure the deployment role secret before the approved hardening workflow can execute.

## Applied change boundary

The confirmed decisions authorized the Aurora, ECS autoscaling, ECS circuit-breaker, and WAF COUNT changes above. They were executed through reviewed CloudFormation import change sets from the authenticated local `skyx` SSO profile, with no resource replacement or deletion. SNS/on-call, TLS/ACM/listeners, network endpoints/egress, alarm thresholds, log retention, Config, and additional IAM remain unexecuted. The protected GitHub `production` environment is still a separate workflow gate for future production deployments.
