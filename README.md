# SkyX infrastructure

This is the third SkyX project: a TypeScript AWS CDK application for gradual infrastructure adoption.

Public repository: https://github.com/mariomelou/skyx-infrastructure

The first commit is intentionally a non-owning adoption manifest. It records the observed production resource identities as CloudFormation outputs, but it does not declare new VPCs, load balancers, ECS services, task definitions, databases, user pools, secrets, or IAM roles. Synthesizing or diffing it therefore cannot recreate the existing application infrastructure.

## Commands

```bash
npm install
npm run build
npm run synth
npm run diff
```

No `cdk deploy`, `cdk import`, bootstrap, migration, or production mutation is part of local validation. Any future ownership change requires a reviewed diff and explicit approval.

## Current boundary

- `skyx-frontend` remains the Amplify/Next.js application repository.
- `skyx-backend` remains responsible for the API image, ECS rollout, and database migrations.
- `skyx-infrastructure` owns the IaC model, adoption plan, and future infrastructure pipeline.
- Secret values are never stored here; only observed secret names are documented.

See [docs/inventory-2026-09-12.md](docs/inventory-2026-09-12.md), [docs/pending-matrix-2026-09-12.md](docs/pending-matrix-2026-09-12.md), [docs/adoption-strategy.md](docs/adoption-strategy.md), [docs/import-plan-2026-09-12.md](docs/import-plan-2026-09-12.md), [docs/ci-iam-design-2026-09-12.md](docs/ci-iam-design-2026-09-12.md), [docs/cli-validation.md](docs/cli-validation.md), and [docs/pipeline.md](docs/pipeline.md).
