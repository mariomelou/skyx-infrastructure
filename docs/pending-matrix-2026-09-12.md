# SkyX IaC pending matrix — 2026-09-12

This matrix separates observed evidence from CDK ownership and production hardening. The current CDK stack is still a non-owning adoption manifest: it emits references and does not create or import application resources.

| Area | Current evidence | CDK / operational status | Remaining gate |
| --- | --- | --- | --- |
| Security groups, routes, and VPC endpoint | Security-group rules and route tables are inventoried; the SkyX VPC has zero endpoints. The observed S3 gateway endpoint belongs to the separate Control Tower VPC. | PROVADO as read-only inventory; only referenced in the manifest. | Decide whether to retain external ownership or prepare resource-by-resource imports. Adding an endpoint would be a production change. |
| ECS autoscaling | Both services have desired/running count 1 and no autoscaling resources. | PROVADO as current state; not enabled by CDK. | Decide target capacity policy. Enabling autoscaling changes runtime behavior. |
| ECS deployment circuit breaker | Not captured authoritatively in the current console pass. | PENDENTE / not modeled as authoritative. | Read the service deployment configuration and record enabled/rollback state before ownership modeling. |
| ALB listeners and rules | Both listeners are HTTP:80 with one rule; target groups and listener summaries are recorded. | PROVADO at summary level; detailed rule conditions and ALB attributes remain unverified. | Capture conditions, health thresholds, idle timeout, access logs, and deletion protection before import modeling. |
| WAF and ACM/TLS | WAF and WAF Classic show zero web ACLs; no ACM certificate was visible in `us-east-1`. | AUSENTE in the current AWS state; no CDK resource is declared. | Defining WAF rules or HTTPS/TLS association is hardening and requires a reviewed design and approval. |
| CloudWatch alarms | Zero alarms observed in `us-east-1`. | AUSENTE; no notification topic or alarm set is defined. | Define SLO thresholds, notification destination, and ownership before creating alarms. |
| AWS Config | Recorder is on, continuous, records default resource types, and shows seven-year retention/delivery settings. | PROVADO as observed; ownership appears coupled to Control Tower and is not recreated. | Verify recorder/delivery-channel ownership and managed rules before any import or change. |
| IAM roles and policies | SkyX role names were observed, but policy documents and trust policies were not captured in full. | Role references are documented; policies are not yet authoritative in CDK. | Perform a bounded read-only policy/trust review. Create no replacement roles until reviewed. |
| IaC preview diff | `build` and `synth` pass. The stack is now explicitly bound to account `129346407469` and `us-east-1`. | `cdk diff` reaches the correct account but is BLOCKED because profile `skyx` has no valid credentials. | Complete SSO for the `skyx` profile, then review the diff for unexpected replacements. |
| CloudFormation adoption | No SkyX application stack exists; no resources have been imported. | PENDENTE by design; current stack is reference-only. | Produce resource-by-resource import plans, retain/rollback settings, and obtain approval before import. |
| Pipeline IAM and deployment | GitHub workflow exists with separate preview and production jobs. | Workflow is code-complete but runtime roles/variables are not configured. | Configure `AWS_IAC_PREVIEW_ROLE_ARN`, protected production environment, and deploy role after IAM review. |
| Runtime hardening | Frontend uses raw HTTP ALB URLs; some environment variables are plaintext; Aurora deletion protection is off; frontend ECS log retention was not set to expire. | Observed risks are documented, not changed. | Coordinate application URL changes, secret policy, DB protection, and log-retention decisions before applying. |
| Database migrations | Backend owns migrations; no migration was run by this project. | PROVADO as boundary. | Preserve this ownership during any future ECS or database import. |

## Bottom line

The inventory points (security groups, routes, endpoint state, autoscaling state, alarms, Config, and WAF absence) are now documented as evidence. They are not yet imported or managed by CloudFormation. The remaining work is primarily: obtain valid CLI credentials for a real diff, complete the few unverified read-only details, configure reviewed CI IAM, and separately approve any hardening or ownership change.
