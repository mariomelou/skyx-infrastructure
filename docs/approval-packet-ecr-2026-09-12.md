# Approval packet — SkyxEcrAdoption import

Status: awaiting explicit approval. This packet identifies one exact CloudFormation change set; it does not execute it.

## Exact target

- Account: `129346407469`
- Region: `us-east-1`
- Stack: `SkyxEcrAdoption`
- Stack status: `REVIEW_IN_PROGRESS`
- Existing repository: `skyx-backend`
- Repository ARN: `arn:aws:ecr:us-east-1:129346407469:repository/skyx-backend`
- Change set: `skyx-ecr-backend-import-20260912`
- Change set ARN: `arn:aws:cloudformation:us-east-1:129346407469:changeSet/skyx-ecr-backend-import-20260912/d6c878be-6e10-4981-9c83-3b02ef9e1f39`
- Change set status: `CREATE_COMPLETE`
- Local opt-in template SHA-256: `220bfdfeddde3ee1667ada9b3ba3b86b850e791aac335d4e0f65202ae28184d8`

## Reviewed change

The change set contains exactly one action:

| Action | Resource type | Logical ID | Physical ID | Replacement | Scope |
| --- | --- | --- | --- | --- | --- |
| `Import` | `AWS::ECR::Repository` | `Repository` | `skyx-backend` | `None` | empty |

The target snapshot was read-only and showed `MUTABLE` tags, scan-on-push enabled, and `AES256` encryption. The opt-in CDK template contains no lifecycle policy, repository policy, tags, image operations, ECS resources, IAM application roles, networking, database, listener, or WAF resources. Both deletion and replacement policies are `Retain`.

## Execution guard

Do not execute locally with `skyx-admin`; that would bypass the protected GitHub environment and the least-privilege deploy role. After a GitHub administrator has configured `production`, required reviewers, `AWS_IAC_DEPLOY_ROLE_ARN`, and `AWS_IAC_IMPORT_ENABLED`, trigger the guarded workflow with the exact ARN:

```bash
gh workflow run infrastructure --ref main \
  -f deploy=false \
  -f import=true \
  -f adoption_component=ecr \
  -f ecr_repository=skyx-backend \
  -f change_set_arn=arn:aws:cloudformation:us-east-1:129346407469:changeSet/skyx-ecr-backend-import-20260912/d6c878be-6e10-4981-9c83-3b02ef9e1f39
```

The workflow revalidates the status, count, action, type, and physical ID before executing. The protected environment reviewer is the final execution gate.

After execution, verify the stack reaches a stable status, `describe-stack-resources` maps `Repository` to the same ECR ARN, the repository properties remain unchanged, and an opt-in `cdk diff` shows no unexpected replacement, deletion, policy, lifecycle, tag, image, or unrelated resource change. If any check fails, stop and do not proceed to another component.

## Approval text

Required approval: “I approve executing exactly the CloudFormation change set `arn:aws:cloudformation:us-east-1:129346407469:changeSet/skyx-ecr-backend-import-20260912/d6c878be-6e10-4981-9c83-3b02ef9e1f39` for importing only the existing `skyx-backend` ECR repository in account `129346407469`, region `us-east-1`, during the agreed execution window.”
