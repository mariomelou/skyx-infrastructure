# SkyX IaC completion audit — 2026-09-12

This audit reflects the current repository and the read-only AWS Console evidence. It deliberately distinguishes local CDK validation, observed AWS state, planned adoption, and changes actually applied.

| Goal requirement | Evidence | State |
| --- | --- | --- |
| Dedicated CDK project created and versioned | Public repository `mariomelou/skyx-infrastructure`; current `main` is published and clean | PROVADO |
| AWS inventory completed for the bounded scope | Inventory covers VPC, routes, security groups, endpoints, ECS, ECR, ALB/target groups, Aurora, Cognito, IAM, secrets, logs, Config, WAF, ACM, alarms, budgets, and Amplify | PROVADO |
| Critical resources and dependencies mapped | Typed production manifest plus observed ARNs/IDs, listeners, health checks, roles, policies, and ownership boundaries | PROVADO |
| Adoption/import strategy defined | `docs/import-plan-2026-09-12.md` defines treatment, sequence, risks, retain/rollback gates, and external ownership | PROVADO as design; no import executed |
| CDK synth works | `npm test` runs build, synth, and manifest invariant verification successfully | PROVADO |
| Read-only invariant preserved | Automated check confirms one `AWS::CDK::Metadata` resource, zero application resources, and eight critical outputs | PROVADO |
| Authenticated AWS diff reviewed | `sts get-caller-identity --profile skyx` returned account `129346407469` and role `AWSPowerUserAccess/mario`; `cdk diff --profile skyx` completed and showed only adoption metadata, the bootstrap parameter, and inventory outputs, with no application resources, replacements, or deletions. `SkyxAdoption` is absent from CloudFormation. | PROVADO for the non-owning preview; stack creation/import remains approval-gated |
| IaC pipeline implemented | GitHub workflow has PR/main validation, fork-safe AWS preview behavior, explicit OIDC account restriction, account verification, main-only manual deployment, and corrected repository-root paths. `SkyXIacPreviewRole` exists with its read-only policy. | PROVADO as code and preview-role setup; repository variable and deploy role/environment remain unconfigured |
| Least-privilege CI boundary documented | `docs/ci-iam-design-2026-09-12.md` separates preview/deploy from application delivery roles and excludes secrets/migrations by default | PROVADO as design; read-only preview role created, deploy role not created |
| Application, database, auth, network, observability, and deploy boundaries documented | Inventory, pending matrix, adoption strategy, import plan, pipeline, and CLI runbook | PROVADO as documentation |
| Migrations remain backend-owned | No migration command is present in IaC workflow or manifest; boundary is documented | PROVADO |
| Production safety preserved | No application deploy, import, stack creation, application-role change, endpoint change, WAF/TLS change, alarm change, or database mutation was executed. One explicitly authorized read-only GitHub OIDC preview role was created; the deploy role was not. The earlier change-set diff published its generated template asset to existing CDK bootstrap storage. | PROVADO for application-resource safety; preview-role setup and bootstrap-asset publication recorded |
| Required approvals identified | Hardening, CI role activation, CloudFormation adoption, and production ownership changes are explicitly gated | PROVADO |

## Current exit condition

The safe local work and authenticated non-owning CDK diff are complete for the bounded scope. The goal remains active for the approval boundary: no adoption stack creation, CloudFormation import, or production hardening should begin until the specific component, change set, rollback plan, and CI role activation are approved. The existing bootstrap template asset published by `cdk diff` is not application ownership or deployment.
