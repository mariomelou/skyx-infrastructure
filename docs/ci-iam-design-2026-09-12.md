# IaC CI IAM design — 2026-09-12

This document defines the minimum role boundary for the GitHub Actions workflow. `SkyXIacPreviewRole` has now been created in account `129346407469` with the read-only policy described below; the deploy role, GitHub variable, and protected environment remain unconfigured.

## Role separation

Do not reuse `SkyXGitHubActionsEcrRole`: it is an application delivery role with ECR push and ECS migration permissions. Do not reuse `SkyXCodeBuildRole`: it is tied to CodeBuild and has broad managed ECR/CloudWatch policies. IaC preview and deployment need separate roles with an OIDC trust limited to `melou-ai/skyx-infrastructure`.

| Role | Workflow use | Current status |
| --- | --- | --- |
| `SkyXIacPreviewRole` | PR/main synth-and-diff preview | Created with the read-only policy below; configure as repository variable `AWS_IAC_PREVIEW_ROLE_ARN` after review |
| `SkyXIacDeployRole` | Manual production workflow after protected-environment approval | Design only; configure as environment secret `AWS_IAC_DEPLOY_ROLE_ARN` after review |

## Trust boundary

Both roles should trust `token.actions.githubusercontent.com` with:

- `aud = sts.amazonaws.com`;
- repository subjects limited to `repo:melou-ai/skyx-infrastructure:*`;
- preview limited to pull requests and the `main` ref;
- deployment limited to the protected `production` environment and explicitly approved workflow path;
- account restriction `129346407469` enforced in the workflow through an explicit `sts get-caller-identity` check.

The repository uses GitHub's immutable OIDC subject format. The preview role therefore also allows the exact subjects `repo:melou-ai@264860045/skyx-infrastructure@1367627542:pull_request` and `repo:melou-ai@264860045/skyx-infrastructure@1367627542:ref:refs/heads/main`, alongside the legacy name-based subjects for transition compatibility.

The exact trust document must be reviewed against the GitHub OIDC subject emitted by the chosen event before creating either role. Fork pull requests must not receive AWS credentials.

## Permission boundary for the current reference-only manifest

The current CDK stack emits outputs and has no application resources. The preview workflow uses `cdk diff --method template`, so its role begins with only the read operations needed to resolve the CDK environment and inspect an existing stack:

- `sts:GetCallerIdentity`;
- `cloudformation:DescribeStacks` and `cloudformation:GetTemplate` for the future SkyX IaC stack ARN;
- `ssm:GetParameter` for the regional CDK bootstrap version parameter;
- `cloudformation:ListStackResources` only if the preview implementation needs stack resource inspection.

The created `SkyXIacPreviewRole` uses these actions against the exact bootstrap parameter and `SkyxAdoption` stack ARN pattern. It has no S3, CloudFormation change-set, IAM, ECS, RDS, Secrets Manager, or `iam:PassRole` permissions. Do not attach blanket `ReadOnlyAccess` by default. If later adoption adds resource lookups, add service-specific read actions only for the resources in that reviewed component.

## Deployment boundary

The deployment role must be separate from preview and limited to the approved CloudFormation lifecycle for the specific SkyX stack, plus the minimum CDK bootstrap read/write paths required by the selected deployment mode. It must not receive broad application-operation permissions by default.

Explicit exclusions for the initial role design:

- no `secretsmanager:GetSecretValue`;
- no database migration or destructive RDS operations;
- no `ecs:RunTask`, `ecs:UpdateService`, or application rollout permissions;
- no `iam:PassRole` unless a reviewed future component needs it and the role ARNs are exact;
- no permission to mutate the external Control Tower VPC, endpoint, or Config resources.

Any future import component must add its own reviewed service permissions and change set evidence rather than expanding these roles preemptively.

## Current AWS access boundary

The initial CLI session was valid for account `129346407469` as `AWSPowerUserAccess/mario`, but that session was not authorized for `iam:GetRole`; read-only checks for both role names returned `AccessDenied`, which did not establish whether either role existed. Under the explicitly authorized `AdministratorAccess` session, both names were checked, the preview role was found absent, and only `SkyXIacPreviewRole` was created with the policy above. `SkyXIacDeployRole` remains uncreated pending a reviewed deployment scope.

## Activation checklist

1. Confirm the authenticated `cdk diff` and the stack/bootstrap resources it actually reads.
2. Set the created preview role ARN as `AWS_IAC_PREVIEW_ROLE_ARN` through the approved repository settings process.
3. Run the workflow on a same-repository pull request and confirm the caller account is `129346407469`.
4. Create the deploy role only after the preview diff and import plan are approved.
5. Configure the protected `production` environment and `AWS_IAC_DEPLOY_ROLE_ARN` secret.
6. Keep import and production deployment manual; never add them to the push or pull-request path.
