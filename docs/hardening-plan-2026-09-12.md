# SkyX production hardening plan — 2026-09-12

Status: design and approval matrix only. No hardening change in this document has been synthesized into an owning production stack or applied to AWS. The current reference-only manifest and the ECR adoption wave remain separate.

## Hardening matrix

| Area | Observed state | Proposed controlled change | Required gate |
| --- | --- | --- | --- |
| ACM/TLS and listeners | Both ALBs expose HTTP:80; no ACM certificate was observed in `us-east-1`; frontend configuration still contains raw HTTP ALB URLs. | Confirm the canonical API/frontend hostnames and DNS ownership, request certificates in the correct region, add HTTPS listeners and HTTP-to-HTTPS redirects, then update application URLs in the frontend/backend release contracts. | Domain/DNS decision, certificate validation, ALB listener diff, application rollout plan, and explicit approval. |
| WAF | No regional web ACL was observed. | Define a regional web ACL for each public ALB or a deliberate shared association, starting with AWS-managed baseline rules and an observation/rate-limit mode where appropriate. | Rule exclusions, false-positive test plan, logging/metrics destination, cost owner, and explicit approval. |
| Security groups | ALB, ECS task, and Aurora security groups are externally managed and their rules are inventoried. | Model exact least-privilege flows: internet to ALB, ALB to task, task to database, and required egress. Remove or narrow rules only after connection evidence and rollback are documented. | Full ingress/egress diff, dependency test, maintenance window, and explicit approval. |
| Routes and VPC endpoints | SkyX VPC has zero endpoints. The observed S3 gateway endpoint belongs to the external Control Tower VPC. | Decide whether private workload egress needs interface/gateway endpoints or NAT changes. Keep the Control Tower endpoint outside SkyX ownership. | Cost/availability analysis, route and endpoint policy diff, and explicit approval. |
| ECS autoscaling | `skyx-api` and `skyx-frontend` each have desired/running count 1 and no autoscaling target/policy. | Define service-specific minimum/maximum capacity, target CPU/memory or request metric, cooldowns, and deployment capacity behavior. | Load baseline, budget, task capacity check, and explicit approval. |
| ECS circuit breaker | Deployment circuit breaker and deployment alarms are off for both services. | Enable rollback-on-failure only with a deployment alarm strategy and a tested failure signal; preserve backend migration ownership outside IaC. | Failure rehearsal, alarm thresholds, rollout plan, and explicit approval. |
| CloudWatch alarms | No alarms were observed. | Define alarms for ALB 5xx/target health, ECS running count and deployment failure, Aurora health/storage/connections, and WAF blocks as applicable. Use an approved SNS/on-call destination. | SLO thresholds, notification owner, noise budget, and explicit approval. |
| AWS Config | Recorder and delivery settings are active under the Control Tower boundary. | Keep recorder/delivery ownership external; inventory and review managed rules rather than recreating or modifying the Control Tower resources here. | Control Tower owner confirmation and explicit exception/ownership decision. |
| Log retention | ECS log groups exist; frontend retention was not set to expire in the inventory. | Choose retention per log group, preserve required audit evidence, and add retention only to resources whose ownership is explicitly accepted. | Compliance/incident-retention decision and explicit approval. |
| Aurora protection | `skyx-prod-db` has deletion protection off and seven-day backups were observed. | First decide deletion-protection and backup/PITR requirements; apply protection as a separate change before any database ownership import. Never combine with migrations or replacement. | Snapshot/restore evidence, maintenance window, and explicit approval. |
| IAM and listeners | Existing application roles are externally owned; the IaC deploy role is scoped only to the ECR adoption stack. ALB listeners are HTTP-only. | Keep application roles referenced, create new roles only per component, and treat listener/TLS changes as a separate ownership unit from ECS and security groups. | Policy simulation, listener diff, `iam:PassRole` review if ever needed, and explicit approval. |

## Ordering and rollback

1. Resolve domain/DNS and observability ownership before TLS/WAF design is considered executable.
2. Produce one component template/diff at a time; do not combine network, database, ECS, listener, and security-group changes in the ECR adoption stack.
3. Review the generated CloudFormation change set for replacements, deletions, route changes, public endpoint changes, and stateful-resource policy changes.
4. Apply only the specifically approved change set in a maintenance window and record pre/post state.
5. Roll back by reverting the reviewed component change where safe; never delete the Aurora cluster, secrets, images, or external Control Tower resources as an automatic rollback.

## Current conclusion

The hardening requirements are now designed and explicitly separated from adoption. The first safe implementation slice is the opt-in `SkyxObservability` component documented in `docs/observability-design-2026-09-12.md`; it synthesizes seven alarms but does not create or adopt SNS, ECS, ALB, or Aurora resources. All production rows remain pending or approval-gated except the read-only inventory evidence and the decision to preserve Control Tower ownership. No TLS, WAF, network, ECS, alarm, Config, log-retention, Aurora, IAM-application, or listener mutation is authorized by this document without its own reviewed diff and explicit approval.
