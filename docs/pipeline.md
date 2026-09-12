# IaC pipeline

The infrastructure pipeline is separate from the frontend and backend image pipelines. The backend workflow continues to own its ECS rollout and migration command; this pipeline must not duplicate either operation.

## Proposed workflow

- Pull requests: install with the lockfile, type-check, synthesize, and produce a reviewed `cdk diff --method template` using a read-only preview role. Fork pull requests run synthesis without AWS credentials.
- Main branch: repeat validation and publish the synthesized CloudFormation artifact.
- Manual production run: the `workflow_dispatch` input `deploy` defaults to `false`; only an explicit `true` on `main`, with a protected GitHub environment and approved deployment role, can reach `cdk deploy --require-approval broad` after the change set is reviewed.
- Import work: never run automatically. Use an explicit operator workflow with resource-by-resource approval and a rollback record.

The workflow in `.github/workflows/iac.yml` is rooted at this repository, requires both OIDC role values instead of falling back to ambient credentials, verifies that both sessions resolve to AWS account `129346407469`, restricts deployment dispatches to `main`, and expects `AWS_IAC_PREVIEW_ROLE_ARN` and `AWS_IAC_DEPLOY_ROLE_ARN` to be configured. The preview role is now created with a read-only policy; the deploy role and GitHub variables/environment still require activation after review. The role boundary is documented in [ci-iam-design-2026-09-12.md](ci-iam-design-2026-09-12.md).
