# Adoption wave 1 — ECR repositories

Status: proposal and unexecuted import prepared for review. The opt-in template and a CloudFormation import change set were created and inspected; no repository import, image change, or production deployment was executed.

## Recommendation

Use the existing ECR repositories as the first ownership candidate because repository import does not change running ECS tasks, task definitions, secrets, database state, listeners, or public endpoints. Import one repository at a time into a dedicated `SkyxEcrAdoption` stack. Start with `skyx-backend`, review the resulting change set and post-import diff, then decide whether to repeat the same procedure for `skyx-frontend`.

## Current read-only evidence

| Repository | ARN | Tag mutability | Scan on push | Encryption | Lifecycle policy | Repository policy | Tags |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `skyx-backend` | `arn:aws:ecr:us-east-1:129346407469:repository/skyx-backend` | `MUTABLE` | `true` | `AES256` | absent | absent | none |
| `skyx-frontend` | `arn:aws:ecr:us-east-1:129346407469:repository/skyx-frontend` | `MUTABLE` | `true` | `AES256` | absent | absent | none |

The repositories are in account `129346407469`, region `us-east-1`. No image content was changed or copied by this inventory.

## Proposed CDK component

The first adoption component should be a dedicated stack with one `AWS::ECR::Repository` resource for the selected repository. The template must preserve the observed state:

- exact `RepositoryName`;
- `ImageTagMutability: MUTABLE`;
- `ImageScanningConfiguration.ScanOnPush: true`;
- `EncryptionConfiguration.EncryptionType: AES256`;
- no lifecycle policy, repository policy, or tags unless a later snapshot proves one exists;
- `DeletionPolicy: Retain` and `UpdateReplacePolicy: Retain`.

The component must not declare ECS services, task definitions, IAM application roles, image pushes, lifecycle rules, repository policies, or cleanup behavior. The default reference-only manifest remains unchanged; the adoption component is opt-in for synthesis and review.

## Required evidence before import

1. Capture a fresh `describe-repositories`, lifecycle-policy, repository-policy, and tags snapshot for the selected repository.
2. Synthesize only the opt-in ECR component and run `npm run verify:ecr`; inspect the template for exact properties and retain policies.
3. Run an authenticated template diff and confirm that the reference-only stack remains unchanged.
4. Generate an import change set for the exact repository ARN; do not execute it yet.
5. Confirm the change set contains an import only, with no replacement, deletion, image mutation, policy addition, or lifecycle-policy change.
6. Obtain explicit approval for the selected repository and change set before execution.
7. After import, run `describe-stack-resources`, re-run the diff, and record the CloudFormation stack/resource IDs.

## Prepared change-set evidence

The opt-in template was synthesized for `skyx-backend`. Change set `skyx-ecr-backend-import-20260912` is `CREATE_COMPLETE` with action `Import` for exactly one `AWS::ECR::Repository` resource (`Repository` -> `skyx-backend`), no replacement, and no scope details. The stack is currently `REVIEW_IN_PROGRESS`; the change set has not been executed. The current state therefore remains pending explicit approval for execution.

## Rollback boundary

If the change set contains anything beyond the intended import, stop and delete the unexecuted change set. If an approved import has already executed, preserve the repository with `Retain` and remove only CloudFormation ownership through an explicitly reviewed procedure; never delete the repository or images as rollback.

## Open approval

The current recommendation is `skyx-backend` as the first imported resource. Approval is still required for the exact repository, dedicated stack name, deploy-role permissions, this change set, and execution window. Until then, both ECR repositories remain externally owned and the CDK default manifest remains non-owning.
