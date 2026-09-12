# SkyX Aurora protection design — 2026-09-12

## Status

`EVIDÊNCIA PROVADA / PROTEÇÃO PENDENTE DE APROVAÇÃO / NÃO APLICADO`. No database setting, snapshot, restore, or migration was changed.

## Observed state

- Cluster: `skyx-prod-db` (`arn:aws:rds:us-east-1:129346407469:cluster:skyx-prod-db`).
- Engine: Aurora PostgreSQL `17.7`; one writer observed; serverless range `0.5–1 ACU`.
- Backup retention: seven days; AWS-managed RDS KMS key `alias/aws/rds`.
- Deletion protection: disabled.
- Backend migrations are not owned by this repository and none were run.

## Controlled design

1. Decide deletion-protection and backup/PITR retention with the database owner.
2. Capture current cluster, instance, parameter-group, subnet-group, security-group, secret, backup, and maintenance-window state.
3. Take/verify a restorable snapshot and record restore evidence before changing protection.
4. Prepare a resource-level update/import diff that changes only the approved protection/backup properties, with `DeletionPolicy: Retain` and `UpdateReplacePolicy: Retain` where CloudFormation ownership is explicitly accepted.
5. Apply in a maintenance window and verify deletion protection, backups, connectivity, and application health. Roll back configuration only; never delete the cluster as an automatic rollback.

## Gate

The required evidence is the approved retention/PITR policy, snapshot/restore check, complete cluster diff, maintenance window, and explicit approval. No Aurora ownership import or protection change is authorized until those gates are satisfied.
