# SkyX IAM and listener ownership design — 2026-09-12

## Status

`EVIDÊNCIA PROVADA / PASSROLE APLICADO / COGNITO SCOPE APLICADO / LISTENER HARDENING PENDENTE`. Existing application roles and ALB listeners remain externally managed; no replacement role or listener mutation was performed.

## IAM boundary

- `SkyXIacPreviewRole` is read-only and limited to account verification, the CDK bootstrap version, and readback of the explicitly reviewed SkyX stack ARN patterns.
- `SkyXIacDeployRole` is scoped to the first ECR adoption component and intentionally excludes `CreateStack`, `UpdateStack`, broad IAM, ECS, RDS, Secrets Manager, migrations, and `iam:PassRole`.
- ECS execution, GitHub OIDC application delivery, and CodeBuild roles are inventoried as externally owned. This repository does not recreate them.
- Any future application-role change requires a separate policy/trust diff, IAM simulation for allowed and denied actions, `iam:PassRole` review if relevant, and an explicit approval.

## ECS task-role handoff permission

The backend deployment role `SkyXGitHubActionsEcrRole` now has the separately reviewed, least-privilege `iam:PassRole` statement required for the backend workflow to submit an ECS task definition that uses the active roles. This is an application-delivery IAM change, not a permission added to `SkyXIacDeployRole`.

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

AWS Console evidence on 2026-09-15 in account `129346407469` shows the inline policy `SkyxEcsPassRole` attached to `SkyXGitHubActionsEcrRole` with exactly the statement above. The policy preview shows `iam:PassRole`, the two exact ECS role resources, and `iam:PassedToService = ecs-tasks.amazonaws.com`. No `AdministratorAccess` or wildcard `PassRole` was added, and no generated `AWSReservedSSO` role was edited.

The scoped deployment-role grant is `PROVADO`. The previously observed wildcard Cognito resource was corrected through the authorized AWS Console change on 2026-09-15. The current policy now trusts `ecs-tasks.amazonaws.com`, includes `cognito-idp:AdminCreateUser` and `cognito-idp:AdminGetUser`, and limits `Resource` to `arn:aws:cognito-idp:us-east-1:129346407469:userpool/us-east-1_wiOmAOPbu`. The Cognito policy-scope gate is now `PROVADO`; the remaining operational gate is rerunning the backend pipeline and validating the invitation/RBAC flows. If console deployment is required, update the IAM Identity Center permission set instead.

## Listener boundary

The API and frontend ALBs currently expose HTTP:80 listeners and existing target groups/rules. TLS/ACM work is defined separately in `docs/tls-acm-design-2026-09-12.md`; listener changes must not be combined with security groups, ECS service imports, database changes, or migrations.

## Gate

The current state is `PROVADO` for the scoped application-delivery `PassRole` grant, Cognito resource restriction, and ownership boundary, and `PENDENTE` for listener hardening or broader application-role change. A future change must show the exact policy/listener diff, replacement/deletion analysis, IAM simulation, target-group preservation, rollback path, and protected-environment approval.
