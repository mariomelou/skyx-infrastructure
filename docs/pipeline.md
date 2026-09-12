# IaC pipeline

The infrastructure pipeline is separate from the frontend and backend image pipelines. The backend workflow continues to own its ECS rollout and migration command; this pipeline must not duplicate either operation.

## Proposed workflow

- Pull requests: install with the lockfile, type-check, synthesize, and produce a reviewed `cdk diff` using a read-only preview role.
- Main branch: repeat validation and publish the synthesized CloudFormation artifact.
- Manual production run: require a protected GitHub environment and an approved deployment role; run `cdk diff` again, then `cdk deploy --require-approval broad` only after the change set is reviewed.
- Import work: never run automatically. Use an explicit operator workflow with resource-by-resource approval and a rollback record.

The workflow in `.github/workflows/iac.yml` is rooted at this repository, restricts both OIDC sessions to AWS account `129346407469`, and intentionally expects `AWS_IAC_PREVIEW_ROLE_ARN` and `AWS_IAC_DEPLOY_ROLE_ARN` to be configured later. The role boundary is documented in [ci-iam-design-2026-09-12.md](ci-iam-design-2026-09-12.md). No IAM role or GitHub environment was created during this task.
