# SkyX production inventory — 2026-09-12

Status: read-only observation. No AWS resources were created, changed, imported, deleted, or deployed by this project.

## Access and evidence boundary

The inventory was performed in the AWS Console using the existing Chrome session in account `129346407469`, role `AdministratorAccess/mario`, region `us-east-1`. The local AWS CLI SSO token was expired and could not be refreshed, so CLI results were not treated as evidence and no alternate account/profile was used.

## Observed resources

| Area | Observed state |
| --- | --- |
| VPC | `skyx-prod-vpc` / `vpc-0118132a0a68f1f8b`, `10.42.0.0/16`; two public and two private subnets; one internet gateway; zero NAT gateways observed. |
| Security groups | `skyx-prod-alb`, `skyx-prod-task`, and `skyx-prod-db` security groups observed. Rule-level review remains pending. |
| ECS | Cluster `skyx-prod`; services `skyx-api` and `skyx-frontend`; one running Fargate task for each; task definitions `skyx-api:4` and `skyx-frontend:1`. |
| ECR | `skyx-backend` and `skyx-frontend` repositories; CDK bootstrap asset repository also present. |
| API task | Port `8000`, image `skyx-backend:latest`, execution role `SkyXEcsTaskExecutionRole`, six Secrets Manager references, and non-secret Cognito/runtime environment variables. Secret values were not viewed. |
| Load balancing | `skyx-prod-alb` targets API port `8000`; `skyx-prod-frontend-alb` targets frontend port `3001`; both internet-facing and in the SkyX VPC. Listener/rule details remain pending. |
| Aurora | Cluster `skyx-prod-db`, Aurora PostgreSQL `17.7`, one writer, serverless range observed as `0.5–1 ACU`, seven-day backups, AWS-managed RDS KMS key, deletion protection disabled. No migrations were run. |
| Cognito | User pool `us-east-1_wiOmAOPbu` and app client `6vouk7sil2f8ohbo7maah044n2` observed. |
| Secrets Manager | SkyX secret names observed for frontend cookie, cursor, scope token, JWT, and database URLs/passwords. Values were never printed or copied. |
| Logs | `/ecs/skyx-api` with one-month retention; `/ecs/skyx-frontend` and Amplify/CodeBuild groups observed with retention not set to expire for the ECS frontend group. |
| IAM | SkyX roles observed: `SkyXCodeBuildRole`, `SkyXEcsTaskExecutionRole`, and `SkyXGitHubActionsEcrRole`. Existing roles are referenced in the adoption plan; they are not recreated. |
| Amplify | `skyx-save-frontend` (`d3sdrlsaj8u9pl`) deployed from `melou-ai/skyx-frontend:main`; current observed domain is `https://main.d3sdrlsaj8u9pl.amplifyapp.com`. |
| CloudFormation | No SkyX application stack was listed among active stacks. CDK bootstrap `CDKToolkit` exists. |
| ACM/WAF | No ACM certificate was visible in `us-east-1`. WAF inventory did not return a conclusive ACL listing and is therefore unverified, not assumed absent. |
| Budgets | No existing AWS budget was visible. No budget was created. |

## Not claimed by this inventory

The following are deliberately `PENDING` or `UNVERIFIED`: exact ALB listener/rule/TLS configuration, all security-group rule directions, route entries, endpoint identity and policy, ECS deployment circuit-breaker/autoscaling details, CloudWatch alarms/metrics, Config recorder/delivery settings, WAF association state, IAM policy documents, and the complete frontend task-definition environment table. These require another bounded read-only pass before ownership is modeled as authoritative.

