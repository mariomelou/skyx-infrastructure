# IaC deploy role scope — ECR adoption wave 1

Status: design only. This document does not create `SkyXIacDeployRole`, configure a GitHub secret, create a GitHub environment, or authorize a deployment.

## Scope

The initial deploy role is scoped only to the approved first adoption component: one existing ECR repository in the `SkyxEcrAdoption` stack. The current recommendation is `skyx-backend`, with the exact repository and stack name still requiring approval.

The role is for CloudFormation change-set preparation and execution for that stack. It is not an application delivery role and must not be reused by the frontend, backend, ECS, or database workflows.

## Proposed permissions

| Action | Resource boundary | Reason |
| --- | --- | --- |
| `sts:GetCallerIdentity` | `*` | Verify the account in the workflow |
| `cloudformation:ValidateTemplate` | `*` | Validate the reviewed template |
| `cloudformation:CreateStack` | `*` | Allow creation of the dedicated adoption stack only when the reviewed import path requires it; the workflow must enforce the approved stack name |
| `cloudformation:DescribeStacks`, `DescribeStackEvents`, `GetTemplate`, `ListStackResources`, `ListChangeSets` | `arn:aws:cloudformation:us-east-1:129346407469:stack/SkyxEcrAdoption/*` | Inspect the dedicated adoption stack |
| `cloudformation:CreateChangeSet`, `DescribeChangeSet`, `ExecuteChangeSet`, `DeleteChangeSet` | `arn:aws:cloudformation:us-east-1:129346407469:stack/SkyxEcrAdoption/*` | Prepare, review, execute, or remove the exact approved change set |
| `ssm:GetParameter` | `arn:aws:ssm:us-east-1:129346407469:parameter/cdk-bootstrap/hnb659fds/version` | Read the CDK bootstrap version |

`CreateStack` is the one action whose resource scope may require `*` in IAM. If the selected import mechanism does not need it, omit it. The workflow and change-set review remain the control that restricts the operation to `SkyxEcrAdoption`; no other CloudFormation stack should be targeted.

No S3 asset permissions are proposed because the ECR component is intended to contain no file assets. If a later CDK implementation synthesizes an asset, add only the exact bootstrap bucket/object actions after inspecting the synthesized template; do not attach broad S3 access preemptively.

## Explicit exclusions

The role must not have ECR write actions, `iam:*`, `iam:PassRole`, ECS rollout actions, RDS/database actions, Secrets Manager value access, VPC/security-group/route actions, ALB/listener actions, WAF/ACM actions, Config actions, or permissions to mutate the external Control Tower resources. It must not execute migrations or change image contents, lifecycle policies, repository policies, or tags as part of the initial import.

## OIDC and environment boundary

The trust policy must require `aud=sts.amazonaws.com` and the exact deployment subject for the protected `production` environment. The immutable repository/environment subject should be used when available, with the legacy name-based environment subject retained only for an explicitly reviewed transition. Pull requests and ordinary pushes must never receive this role.

The repository currently has no `production` environment. Before configuring the role secret, create `production` with required reviewers and prevent self-approval where GitHub policy allows. Store the role ARN only as the environment secret `AWS_IAC_DEPLOY_ROLE_ARN`; do not put it in a repository variable or source file. The existing workflow already requires `workflow_dispatch`, `main`, `inputs.deploy == true`, and the protected environment.

## Activation gates

1. Approve `skyx-backend` versus `skyx-frontend` and the exact `SkyxEcrAdoption` stack name.
2. Implement the opt-in ECR component and inspect its synthesized template for one repository, retain policies, and no unrelated resources.
3. Generate the import change set without executing it; confirm import-only behavior and the absence of replacements, deletions, image mutations, and policy/lifecycle changes.
4. Review the final trust policy and permissions against that change set.
5. Create the role and protected environment, then configure the environment secret.
6. Execute only the approved change set in the approved window and record the post-import resource list and diff.

Until these gates are met, `SkyXIacDeployRole` and the `production` environment remain intentionally unconfigured.
