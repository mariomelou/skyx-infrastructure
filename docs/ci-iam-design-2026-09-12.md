# IaC CI IAM design — 2026-09-12

This document defines the minimum role boundary for the GitHub Actions workflow. It is a policy design, not an IAM change. No role, trust policy, GitHub variable, or environment was created by this repository.

## Role separation

Do not reuse `SkyXGitHubActionsEcrRole`: it is an application delivery role with ECR push and ECS migration permissions. Do not reuse `SkyXCodeBuildRole`: it is tied to CodeBuild and has broad managed ECR/CloudWatch policies. IaC preview and deployment need separate roles with an OIDC trust limited to `mariomelou/skyx-infrastructure`.

| Role | Workflow use | Current status |
| --- | --- | --- |
| `SkyXIacPreviewRole` | PR/main synth-and-diff preview | Design only; configure as repository variable `AWS_IAC_PREVIEW_ROLE_ARN` after review |
| `SkyXIacDeployRole` | Manual production workflow after protected-environment approval | Design only; configure as environment secret `AWS_IAC_DEPLOY_ROLE_ARN` after review |

## Trust boundary

Both roles should trust `token.actions.githubusercontent.com` with:

- `aud = sts.amazonaws.com`;
- repository subjects limited to `repo:mariomelou/skyx-infrastructure:*`;
- preview limited to pull requests and the `main` ref;
- deployment limited to the protected `production` environment and explicitly approved workflow path;
- account restriction `129346407469` enforced in the workflow through `allowed-account-ids`.

The exact trust document must be reviewed against the GitHub OIDC subject emitted by the chosen event before creating either role. Fork pull requests must not receive AWS credentials.

## Permission boundary for the current reference-only manifest

The current CDK stack emits outputs and has no application resources. A preview role should begin with only the read operations needed to resolve the CDK environment and inspect an existing stack, such as:

- `sts:GetCallerIdentity`;
- `cloudformation:DescribeStacks` and `cloudformation:GetTemplate` for the future SkyX IaC stack ARN;
- `ssm:GetParameter` for the regional CDK bootstrap version parameter;
- `cloudformation:ListStackResources` only if the preview implementation needs stack resource inspection.

The exact resource ARNs and whether the bootstrap parameter is required must be confirmed by a successful authenticated `cdk diff`. Do not attach blanket `ReadOnlyAccess` by default. If later adoption adds resource lookups, add service-specific read actions only for the resources in that reviewed component.

## Deployment boundary

The deployment role must be separate from preview and limited to the approved CloudFormation lifecycle for the specific SkyX stack, plus the minimum CDK bootstrap read/write paths required by the selected deployment mode. It must not receive broad application-operation permissions by default.

Explicit exclusions for the initial role design:

- no `secretsmanager:GetSecretValue`;
- no database migration or destructive RDS operations;
- no `ecs:RunTask`, `ecs:UpdateService`, or application rollout permissions;
- no `iam:PassRole` unless a reviewed future component needs it and the role ARNs are exact;
- no permission to mutate the external Control Tower VPC, endpoint, or Config resources.

Any future import component must add its own reviewed service permissions and change set evidence rather than expanding these roles preemptively.

## Activation checklist

1. Confirm the authenticated `cdk diff` and the stack/bootstrap resources it actually reads.
2. Create the preview role through the approved IAM process and set `AWS_IAC_PREVIEW_ROLE_ARN` as a repository variable.
3. Run the workflow on a pull request and confirm the caller account is `129346407469`.
4. Create the deploy role only after the preview diff and import plan are approved.
5. Configure the protected `production` environment and `AWS_IAC_DEPLOY_ROLE_ARN` secret.
6. Keep import and production deployment manual; never add them to the push or pull-request path.
