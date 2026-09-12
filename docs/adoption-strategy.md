# Adoption strategy

The current stack is an adoption manifest, not an ownership claim. This is intentional because the existing SkyX VPC, ECS, ALB, Aurora, Cognito, ECR, Secrets Manager, IAM, logging, and Amplify resources were created outside a SkyX CloudFormation stack.

## Phases

1. **Reference-only baseline (complete locally).** Keep immutable IDs, names, ARNs, and observed configuration in typed data. Generate only outputs. Run `npm run build`, `npm run synth`, and `npm run diff`.
2. **Complete read-only inventory (complete for the current bounded scope).** SG rules, route entries, service counts, ECS deployment behavior, listener/rule state, target-group health checks, ALB attributes, alarms, WAF absence, Config state, endpoint placement and policy, and IAM policy/trust documents are recorded. The external Control Tower endpoint is explicitly excluded from SkyX ownership.
3. **Import design (pending approval).** For each resource, choose one of: retain external ownership, import into a dedicated CloudFormation stack, or model with a CDK reference. Import must be resource-specific and tested against a snapshot. No broad replacement is acceptable.
4. **Staged ownership (approval required).** Import low-risk supporting resources first, then review `cdk diff` and CloudFormation change sets. Keep database, secrets, Cognito, and live ECS services protected with retain policies and explicit rollback procedures.
5. **Operational handoff (approval required).** Only after a reviewed import plan and permissions are approved should the IaC pipeline be allowed to deploy.

## Explicit boundaries

- The backend repository owns database migrations. IaC must never execute Alembic or `RUN_MIGRATIONS=true`.
- Secret values stay in Secrets Manager; CDK source and logs may contain names/ARNs but not values.
- Existing IAM roles should be imported/referenced rather than replaced until trust and policy documents are reviewed.
- Aurora deletion protection should be enabled or an explicit exception documented before any ownership import.
- Current production gaps are intentionally recorded as decisions, not silently changed: autoscaling, ECS circuit breaker/deployment alarms, WAF, ACM/TLS, CloudWatch alarms/logging, ALB deletion protection, secret exposure cleanup, and frontend HTTP endpoint migration.
- The current adoption manifest is not an import specification. A resource-by-resource import plan, ownership decision, retain policy, rollback path, and reviewed CLI diff are required before CloudFormation adoption.
- No production deployment, CloudFormation import, CDK bootstrap, or migration is authorized by this local preparation.
