# SkyX IAM and listener ownership design — 2026-09-12

## Status

`EVIDÊNCIA PROVADA / APLICAÇÃO PENDENTE`. Existing application roles and ALB listeners remain externally managed; no replacement role, listener, `iam:PassRole`, or production policy mutation was performed.

## IAM boundary

- `SkyXIacPreviewRole` is read-only and limited to account verification, the CDK bootstrap version, and readback of the explicitly reviewed SkyX stack ARN patterns.
- `SkyXIacDeployRole` is scoped to the first ECR adoption component and intentionally excludes `CreateStack`, `UpdateStack`, broad IAM, ECS, RDS, Secrets Manager, migrations, and `iam:PassRole`.
- ECS execution, GitHub OIDC application delivery, and CodeBuild roles are inventoried as externally owned. This repository does not recreate them.
- Any future application-role change requires a separate policy/trust diff, IAM simulation for allowed and denied actions, `iam:PassRole` review if relevant, and an explicit approval.

## Pending ECS task-role handoff permission

The backend deployment role `SkyXGitHubActionsEcrRole` still needs a separately reviewed, least-privilege `iam:PassRole` statement before the backend workflow can submit an ECS task definition that uses the active roles. This is an application-delivery IAM change, not a permission to add to `SkyXIacDeployRole`, and it has not been applied by this repository or through the AWS Console.

The intended statement is limited to the two existing ECS roles and the ECS tasks service:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "PassSkyxEcsRoles",
      "Effect": "Allow",
      "Action": "iam:PassRole",
      "Resource": [
        "arn:aws:iam::129346407469:role/SkyXApiTaskRole",
        "arn:aws:iam::129346407469:role/SkyXEcsTaskExecutionRole"
      ],
      "Condition": {
        "StringEquals": {
          "iam:PassedToService": "ecs-tasks.amazonaws.com"
        }
      }
    }
  ]
}
```

Required verification before marking this gate `PROVADO`: confirm the task-role trust is `ecs-tasks.amazonaws.com`, Cognito actions are restricted to the intended user pool, the active `skyx-api:5` definition retains the task and execution roles, and a rerun of the backend pipeline completes migrations and deployment successfully. Do not grant `AdministratorAccess`, wildcard `PassRole`, or edit a generated `AWSReservedSSO` role directly; if console deployment is required, update the IAM Identity Center permission set instead.

## Listener boundary

The API and frontend ALBs currently expose HTTP:80 listeners and existing target groups/rules. TLS/ACM work is defined separately in `docs/tls-acm-design-2026-09-12.md`; listener changes must not be combined with security groups, ECS service imports, database changes, or migrations.

## Gate

The current state is `PROVADO` as an ownership boundary and `PENDENTE` for any application-role or listener hardening. A future change must show the exact policy/listener diff, replacement/deletion analysis, IAM simulation, target-group preservation, rollback path, and protected-environment approval.
