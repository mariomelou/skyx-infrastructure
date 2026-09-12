# SkyX CloudFormation adoption plan — 2026-09-12

This is a design and review artifact. It is not an import command, a CloudFormation template, or an authorization to change production. The current CDK stack remains reference-only and declares no application resources.

## First candidate for staged adoption

The proposed first candidate is one ECR repository in a dedicated `SkyxEcrAdoption` stack. The evidence, exact observed properties, required import-only change-set checks, and rollback boundary are recorded in [adoption-wave-1-ecr-2026-09-12.md](adoption-wave-1-ecr-2026-09-12.md). `skyx-backend` is recommended first because the procedure does not touch running ECS tasks, task definitions, listeners, secrets, database state, or public endpoints. This remains a proposal: no repository is import-ready until the selected repository, template, change set, role permissions, and execution window are reviewed and explicitly approved.

## Resource-by-resource treatment

| Resource group | Current identity/evidence | Proposed treatment | Risk and gate |
| --- | --- | --- | --- |
| VPC, subnets, internet gateway, route tables | VPC `vpc-0118132a0a68f1f8b`; two public and two private subnets; IGW `igw-006aff6fae065b876`; route tables recorded in the inventory | Import only after dependency graph and subnet/route associations are represented in a dedicated network stack, or retain external ownership and reference IDs | High blast radius. Review every route and replacement behavior; never recreate the VPC or subnets |
| Security groups | ALB `sg-0fb59dedab7b7aa9c`; task `sg-0d08082390032bcfe`; database `sg-08dfa784deaaf3a4e` | Prefer import into a dedicated network stack after ingress/egress rules are modeled exactly | High. A rule replacement can interrupt ALB, ECS, or database traffic; require change set review |
| VPC endpoint | SkyX VPC has zero endpoints; S3 gateway `vpce-0be79b16f26533b68` belongs to external `aws-controltower-VPC` | Keep outside SkyX ownership and reference only as evidence | Do not import or edit the Control Tower resource from this repository |
| ECS cluster and services | Cluster `skyx-prod`; services `skyx-api` and `skyx-frontend`; desired/running count 1 | Import only after task definitions, capacity, deployment settings, target groups, and service-linked dependencies are modeled | High. Preserve task definitions, desired count, public IP behavior, and migration boundary; no migration execution |
| ECS task definitions | `skyx-api:4` and `skyx-frontend:1` | Treat revisions as application-owned artifacts; reference the active revision from infrastructure rather than recreate it | High. Never replace a running task definition implicitly; backend retains migration ownership |
| ECR repositories | `skyx-backend` and `skyx-frontend` | Import or reference repositories in a separate low-risk registry component | Medium. Preserve repository names, lifecycle policy, encryption, and access policy before import |
| API and frontend ALBs | `skyx-prod-alb` and `skyx-prod-frontend-alb`; HTTP:80; attributes and logs recorded | Import after listeners, rules, target groups, and security-group dependencies are modeled | High. HTTPS/TLS, WAF, logging, deletion protection, and response-header changes are separate approved hardening work |
| Target groups | `skyx-prod-api` and `skyx-prod-frontend`; health checks `/health/live` and `/sign-in`; thresholds and timing recorded | Import with listeners and ECS service attachment as one reviewed dependency set | High. Preserve health paths and success codes; validate target registration before any ownership change |
| Aurora database | Cluster `skyx-prod-db`, Aurora PostgreSQL 17.7, seven-day backups, deletion protection off | Retain external ownership initially; import only with snapshot/rollback plan and deletion protection decision | Critical. No database replacement, parameter-group change, migration, or destructive update is allowed by this plan |
| Cognito | User pool `us-east-1_wiOmAOPbu` and app client recorded | Retain/reference initially; import only after callback URLs, policies, and client behavior are snapshotted | High. Authentication behavior can break without a replacement resource |
| Secrets Manager | SkyX secret names recorded; values intentionally never read | Reference existing secrets by ARN/name; do not import values into CDK source | Critical. No secret value migration or rotation is authorized here |
| IAM roles | `SkyXEcsTaskExecutionRole`, `SkyXGitHubActionsEcrRole`, `SkyXCodeBuildRole`; trust and policies recorded | Retain/reference existing roles first; create new least-privilege CI roles only after policy review | High. Do not replace trust policies or broaden permissions as part of adoption |
| CloudWatch log groups | `/ecs/skyx-api`, `/ecs/skyx-frontend`, plus Amplify/CodeBuild groups observed | Import or reference only after retention and ownership are explicitly decided | Medium. Retention changes are operational changes and require approval |
| CloudWatch alarms and WAF/ACM | Zero alarms, zero WAF web ACLs, no ACM certificate observed in `us-east-1` | Do not import absent resources; define them separately as reviewed hardening components | High. Thresholds, notification destinations, WAF rules, and TLS certificate ownership are not inferable from absence |
| AWS Config and Budgets | Config recorder is on under Control Tower boundary; no budget observed | Retain external Config ownership; create a budget only after owner/threshold/notification decisions | Medium. Do not take ownership of Control Tower resources from SkyX |
| Amplify | `skyx-save-frontend` app `d3sdrlsaj8u9pl` | Keep application/deployment ownership in the frontend workflow; reference only from inventory | Medium. Do not move Amplify deployment ownership into this stack without an explicit migration plan |

## Required sequence before any import

1. Restore a valid `skyx` CLI session and run `cdk diff` against account `129346407469` in `us-east-1`.
2. Replace the reference-only outputs with one narrowly scoped CDK component at a time; keep `RemovalPolicy.RETAIN` for stateful resources.
3. Generate and review the CloudFormation import change set for that exact component.
4. Confirm no replacement, deletion, migration, secret-value change, or public endpoint change appears in the change set.
5. Obtain explicit approval for the specific component, then import it and re-run the diff.
6. Record the resulting CloudFormation stack/resource IDs and rollback evidence before proceeding to the next component.

## Current decision

No resource has been imported in the current commit. The ECR wave is scoped as the first candidate, and its opt-in template plus import-only change set have been prepared and validated, but execution remains pending explicit approval. This plan defines the safe boundary and sequence; it does not authorize an import or production deployment.
