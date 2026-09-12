# SkyX log-retention component design — 2026-09-12

## Status

`PREPARADO / IMPORT-ORIENTED / NÃO APLICADO`. The two ECS log groups already exist outside CloudFormation. This component is a template for a reviewed import or property update, not a generic create/deploy path.

## Resources and ownership boundary

The template declares `/ecs/skyx-api` and `/ecs/skyx-frontend` as `AWS::Logs::LogGroup` resources with an explicit retention input and both `DeletionPolicy` and `UpdateReplacePolicy` set to `Retain`. It does not create ECS services, Aurora resources, or log destinations.

The local verifier uses 30 days only as a review fixture. The production value must be chosen from the accepted CloudWatch Logs retention values after compliance, incident-response, and cost review. Existing encryption and other log-group properties must be revalidated in the import change set before execution.

## Validation and gate

```bash
npm run verify:log-retention
```

The verifier proves the two expected names, retention fixture, and retain policies. Applying the template requires a resource-by-resource import/update change set, exact pre/post log-group evidence, a retention decision, the protected GitHub environment, and explicit approval. It must not be mixed with backend migrations or ECS service changes.

The guarded GitHub validation run `34724135711` passed synthesis and authenticated template diff for this component. Its import and generic deployment jobs were skipped by design.
