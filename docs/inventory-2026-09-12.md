# SkyX production inventory — 2026-09-12

Status: bounded read-only observation plus authenticated CDK diff. No SkyX application resources were created, changed, imported, deleted, or deployed by this project. The authenticated diff published its generated template asset to existing CDK bootstrap storage; it did not create the `SkyxAdoption` stack or any application resource.

## Access and evidence boundary

The inventory was performed in the AWS Console using the existing Chrome session in the **Mario Melo Studio** profile, account `129346407469`, role `AWSPowerUserAccess/mario`, region `us-east-1`. The `skyx` AWS CLI profile now targets that same account and role: `sts get-caller-identity` succeeded and the authenticated `cdk diff` completed with no application-resource changes, replacements, or deletions. The access portal used was `https://d-9066763dce.awsapps.com/start`; the older `default` profile targets account `250879721047` and is not used for SkyX validation.

## Observed resources

| Area | Observed state |
| --- | --- |
| VPC | `skyx-prod-vpc` / `vpc-0118132a0a68f1f8b`, `10.42.0.0/16`; two public and two private subnets; one internet gateway; zero NAT gateways. SkyX has no VPC endpoint. The only regional endpoint is S3 gateway `vpce-0be79b16f26533b68` in external `aws-controltower-VPC` / `vpc-08afe822bbaef16c8`, with policy `Allow` for `Principal *`, `Action *`, `Resource *`; it remains outside SkyX ownership. |
| Security groups | `skyx-prod-alb`: inbound TCP/80 from `0.0.0.0/0`, outbound all IPv4; `skyx-prod-task`: inbound TCP/8000 and TCP/3001 from the ALB SG, outbound all IPv4; `skyx-prod-db`: inbound TCP/5432 from the task SG, outbound all IPv4. |
| ECS | Cluster `skyx-prod`; services `skyx-api` and `skyx-frontend`; one desired/running Fargate task each; task definitions `skyx-api:4` and `skyx-frontend:1`; availability-zone rebalancing on; auto-assign public IP on; no autoscaling, Service Connect, or service discovery configured. |
| ECR | `skyx-backend` and `skyx-frontend` repositories; CDK bootstrap asset repository also present. |
| API task | Port `8000`, image `skyx-backend:latest`, execution role `SkyXEcsTaskExecutionRole`, six Secrets Manager references, and non-secret Cognito/runtime environment variables. No container health check was configured. Secret values were not viewed. |
| Frontend task | Port `3001`, execution role `SkyXEcsTaskExecutionRole`, ten plaintext environment variables, one cookie-secret reference, and an ECS health check with interval 30s, timeout 5s, start period 30s, and 3 retries. |
| Load balancing | `skyx-prod-alb` targets API port `8000`; its listener is HTTP:80 with the default rule, no conditions, 100% forward to `skyx-prod-api`, target-group stickiness off, no response headers, and ALB server header on. The API target group health check is HTTP `/health/live` on traffic-port, success `200`, 5 healthy / 2 unhealthy threshold, 5-second timeout, and 30-second interval. `skyx-prod-frontend-alb` has the equivalent default rule forwarding 100% to `skyx-prod-frontend`; its target group health check is HTTP `/sign-in` on traffic-port with the same thresholds, timeout, interval, and success code. Both have stickiness off, no response headers, and server header on. Both ALBs have HTTP/2 on, 60-second idle timeout, 3,600-second client keepalive, defensive desync mitigation, X-Forwarded-For append, cross-zone balancing on, deletion protection off, and access/connection/health-check logs off. Neither listener has a TLS certificate. Both are internet-facing and in the SkyX VPC. |
| Aurora | Cluster `skyx-prod-db`, Aurora PostgreSQL `17.7`, one writer, serverless range observed as `0.5–1 ACU`, seven-day backups, AWS-managed RDS KMS key, deletion protection disabled. No migrations were run. |
| Cognito | User pool `us-east-1_wiOmAOPbu` and app client `6vouk7sil2f8ohbo7maah044n2` observed. |
| Secrets Manager | SkyX secret names observed for frontend cookie, cursor, scope token, JWT, and database URLs/passwords. Values were never printed or copied. |
| Logs | `/ecs/skyx-api` with one-month retention; `/ecs/skyx-frontend` and Amplify/CodeBuild groups observed with retention not set to expire for the ECS frontend group. |
| Monitoring | CloudWatch Alarms list returned zero alarms in `us-east-1`. AWS Config recorder is on, continuous, records all default resource types, and shows a seven-year default retention/delivery configuration. |
| IAM | SkyX roles observed: `SkyXCodeBuildRole`, `SkyXEcsTaskExecutionRole`, and `SkyXGitHubActionsEcrRole`. The ECS execution role trusts `ecs-tasks.amazonaws.com` and has AWS-managed `AmazonECSTaskExecutionRolePolicy` plus inline `SkyXFrontendSecretRead` and `SkyXSecretsRead`. The GitHub role trusts `token.actions.githubusercontent.com` with audience `sts.amazonaws.com` and repository subject conditions; its inline policies are `SkyXEcrPush` and `SkyxEcsMigrationRunTask`. The CodeBuild role trusts `codebuild.amazonaws.com` and has AWS-managed `AmazonEC2ContainerRegistryPowerUser`, `CloudWatchLogsFullAccess`, plus inline `SkyXCodeBuildUseGitHubConnection` scoped to one CodeConnections ARN. Existing roles are referenced in the adoption plan; they are not recreated. |
| Amplify | `skyx-save-frontend` (`d3sdrlsaj8u9pl`) deployed from `melou-ai/skyx-frontend:main`; current observed domain is `https://main.d3sdrlsaj8u9pl.amplifyapp.com`. |
| Frontend task | Ten plaintext environment variables and one Secrets Manager reference observed: Cognito identifiers, `NODE_ENV=production`, `PORT=3001`, backend mode, Cognito auth mode, and raw HTTP ALB URLs for backend/password reset. The cookie secret value was not viewed. |
| CloudFormation | No SkyX application stack was listed among active stacks. CDK bootstrap `CDKToolkit` exists. |
| ACM/WAF | No ACM certificate was visible in `us-east-1`. Both AWS WAF and WAF Classic showed zero web ACLs in the region. |
| Budgets | No existing AWS budget was visible. No budget was created. |

## Not claimed by this inventory

This inventory deliberately does not claim CloudFormation ownership or import execution. The resource-by-resource adoption design is documented separately, but no component-specific change set, import, hardening change, or production deployment has been performed.
