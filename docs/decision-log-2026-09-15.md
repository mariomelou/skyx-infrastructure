# SkyX hardening decision log — 2026-09-15

This record captures the user's confirmed hardening decisions and keeps unresolved production inputs explicit. Cognito is intentionally out of scope for this wave.

## Confirmed decisions

- Aurora: enable deletion protection, use 30-day backups, and enable PITR. The change still requires snapshot/restore evidence, a complete diff, a maintenance window, and explicit execution approval.
- Application IAM ownership: keep the existing application roles externally managed; do not recreate or replace them from this repository.
- ALB listeners: adopt HTTP-to-HTTPS redirection once canonical hostnames and validated ACM certificates exist. No listener mutation is executable before those values are available.
- ECS autoscaling: API minimum/maximum `1–4` with CPU target `60%`; frontend minimum/maximum `1–3` with CPU target `60%`.
- WAF: start in `COUNT` mode without blocking or WAF logging; blocking and logging remain a later decision.
- AWS Config: keep recorder, delivery, and Control Tower-managed ownership external; do not recreate or modify those resources here.
- ECS deployment circuit breaker: target `enable=true` and `rollback=true`, keeping the service snapshot, failure rehearsal, rollback procedure, and execution approval as gates.

## Pending decisions and blockers

- SNS/on-call: choose the alert topic owner, topic/subscription destination, and operational escalation channel. No SNS topic exists in `us-east-1`.
- TLS/ACM: provide canonical API/frontend hostnames, DNS ownership/validation path, and certificate ARNs or approval to request certificates.
- Network: decide whether to keep public egress or introduce private endpoints; if private, approve the service set, endpoint policy, route changes, cost owner, and availability plan.
- Alarm inputs: confirm ALB 5XX and Aurora connection thresholds, plus the notification destination.
- Log retention: confirm the exact retention period; the local template currently uses 30 days as a review input only.
- IAM/listener details: confirm any additional policy or listener changes beyond externally managed roles and HTTP-to-HTTPS redirection.
- GitHub: a repository administrator must create and protect the `production` environment and configure the deployment role secret before the approved hardening workflow can execute.

## Execution boundary

The confirmed decisions authorize preparation of isolated templates and diffs. They do not authorize a combined production deployment. Each component still requires its own rendered diff, change-set resource mapping, rollback plan, and explicit execution approval.
