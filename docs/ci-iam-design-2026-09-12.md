# IaC CI IAM design — 2026-09-12

This document defines the minimum role boundary for the GitHub Actions workflow. `SkyXIacPreviewRole` has been created in account `129346407469` with the read-only policy described below, and `AWS_IAC_PREVIEW_ROLE_ARN` is configured in the repository. `SkyXIacDeployRole` has now been created with the first-wave ECR policy; the protected environment remains unconfigured because the current GitHub token lacks repository-admin permission.

## Role separation

Do not reuse `SkyXGitHubActionsEcrRole`: it is an application delivery role with ECR push and ECS migration permissions. Do not reuse `SkyXCodeBuildRole`: it is tied to CodeBuild and has broad managed ECR/CloudWatch policies. IaC preview and deployment need separate roles with an OIDC trust limited to `melou-ai/skyx-infrastructure`.

| Role | Workflow use | Current status |
| --- | --- | --- |
| `SkyXIacPreviewRole` | PR/main synth-and-diff preview | Created with the read-only policy below; repository variable `AWS_IAC_PREVIEW_ROLE_ARN` is configured |
| `SkyXIacDeployRole` | Manual production workflow after protected-environment approval | Created with the versioned first-wave policy; configure as environment secret `AWS_IAC_DEPLOY_ROLE_ARN` after GitHub admin configures `production` |

## Trust boundary

Both roles should trust `token.actions.githubusercontent.com` with:

- `aud = sts.amazonaws.com`;
- repository subjects limited to `repo:melou-ai/skyx-infrastructure:*`;
- preview limited to pull requests and the `main` ref;
- deployment limited to the protected `production` environment and explicitly approved workflow path;
- account restriction `129346407469` enforced in the workflow through an explicit `sts get-caller-identity` check.

The repository uses GitHub's immutable OIDC subject format. The preview role therefore also allows the exact subjects `repo:melou-ai@264860045/skyx-infrastructure@1367627542:pull_request` and `repo:melou-ai@264860045/skyx-infrastructure@1367627542:ref:refs/heads/main`, alongside the legacy name-based subjects for transition compatibility.

The exact trust documents were reviewed against the repository's immutable OIDC identifiers before creating the roles. Fork pull requests must not receive AWS credentials; future trust changes require the same review.

## Permission boundary for the current reference-only manifest

The current CDK stack emits outputs and has no application resources. The preview workflow uses `cdk diff --method template`, so its role begins with only the read operations needed to resolve the CDK environment and inspect an existing stack:

- `sts:GetCallerIdentity`;
- `cloudformation:DescribeStacks` and `cloudformation:GetTemplate` for the future SkyX IaC stack ARN;
- `ssm:GetParameter` for the regional CDK bootstrap version parameter;
- `cloudformation:ListStackResources` only if the preview implementation needs stack resource inspection.

The created `SkyXIacPreviewRole` uses these actions against the exact bootstrap parameter and the `SkyxAdoption`, `SkyxEcrAdoption`, `SkyxObservability`, `SkyxEcsScaling`, `SkyxWaf`, and `SkyxLogRetention` stack ARN patterns. Its versioned policy is [skyx-iac-preview-role-policy.json](../config/iam/skyx-iac-preview-role-policy.json). It has no S3, CloudFormation change-set, IAM, ECS, RDS, Secrets Manager, or `iam:PassRole` permissions. Do not attach blanket `ReadOnlyAccess` by default. If later adoption adds resource lookups, add service-specific read actions only for the resources in that reviewed component.

## Deployment boundary

The deployment role must be separate from preview and limited to the approved CloudFormation lifecycle for the specific SkyX stack, plus the minimum CDK bootstrap read/write paths required by the selected deployment mode. The concrete first-wave proposal is documented in [deploy-role-scope-2026-09-12.md](deploy-role-scope-2026-09-12.md); it targets only a dedicated ECR adoption stack and remains design-only until the component and import change set are approved. It must not receive broad application-operation permissions by default.

Explicit exclusions for the initial role design:

- no `secretsmanager:GetSecretValue`;
- no database migration or destructive RDS operations;
- no `ecs:RunTask`, `ecs:UpdateService`, or application rollout permissions;
- no `iam:PassRole` unless a reviewed future component needs it and the role ARNs are exact;
- no permission to mutate the external Control Tower VPC, endpoint, or Config resources.

Any future import component must add its own reviewed service permissions and change set evidence rather than expanding these roles preemptively.

## Current AWS access boundary

The initial CLI session was valid for account `129346407469` as `AWSPowerUserAccess/mario`, but that session was not authorized for `iam:GetRole`; read-only checks for both role names returned `AccessDenied`, which did not establish whether either role existed. Under the explicitly authorized `AdministratorAccess` session, the first-wave policy was validated, `SkyXIacDeployRole` was created with a one-hour maximum session and the versioned policy, and its allowed/denied actions were checked with IAM simulation. The GitHub environment and environment secret remain unconfigured because the current GitHub token has `admin=false` for the repository.

## Activation checklist

1. Confirm the authenticated `cdk diff` and the stack/bootstrap resources it actually reads.
2. Set the created preview role ARN as `AWS_IAC_PREVIEW_ROLE_ARN` through the approved repository settings process. **Done.**
3. Run the workflow on a same-repository pull request and confirm the caller account is `129346407469`.
4. **Done:** create the deploy role only after the preview diff, ECR component, and import plan are scoped; use the policy in `docs/deploy-role-scope-2026-09-12.md`.
5. Configure the protected `production` environment and `AWS_IAC_DEPLOY_ROLE_ARN` secret using a GitHub administrator.
6. Keep import and production deployment manual; never add them to the push or pull-request path.

## GitHub administrator activation

The current `gh` token has repository `push` but not `admin` permission, so these commands must be run by a GitHub repository administrator. They create the protected environment, require an organization-admin reviewer, restrict deployments to `main`, and store the role ARN only as an environment secret:

```bash
gh api --method PUT repos/melou-ai/skyx-infrastructure/environments/production --input - <<'JSON'
{
  "wait_timer": 0,
  "prevent_self_review": true,
  "reviewers": [
    {"type": "User", "id": 65774721},
    {"type": "User", "id": 40343851}
  ],
  "deployment_branch_policy": {
    "protected_branches": false,
    "custom_branch_policies": true
  }
}
JSON

gh api --method POST repos/melou-ai/skyx-infrastructure/environments/production/deployment-branch-policies \
  -f name=main -f type=branch

gh secret set AWS_IAC_DEPLOY_ROLE_ARN --env production \
  --body arn:aws:iam::129346407469:role/SkyXIacDeployRole

gh variable set AWS_IAC_IMPORT_ENABLED \
  --body true
```

Afterward, verify the environment protection rules, secret, and repository variable through the repository settings/API before enabling any production run. Do not run the import or deploy job merely because the environment exists; review the exact change set and obtain the separate execution approval first.
