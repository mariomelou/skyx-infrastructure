# SkyX network hardening design — 2026-09-12

## Status

`EVIDÊNCIA PROVADA / DESENHO PENDENTE DE DECISÃO / NÃO APLICADO`. No security-group rule, route, NAT, or VPC endpoint mutation has been executed.

## Observed boundary

- VPC: `vpc-0118132a0a68f1f8b`, CIDR `10.42.0.0/16`.
- Public subnets: `subnet-042eb9e7a021e2d63`, `subnet-02158e7027fc2fe61`.
- Private subnets: `subnet-0d1bd575ca1de7c76`, `subnet-05bac08a52afb3bbb`.
- Internet gateway: `igw-006aff6fae065b876`; NAT gateway count: zero; SkyX VPC endpoint count: zero.
- Security groups: ALB `sg-0fb59dedab7b7aa9c`, task `sg-0d08082390032bcfe`, database `sg-08dfa784dea3f4a4e`.
- Current flows: public TCP/80 to the ALB; ALB SG to task TCP/8000 and TCP/3001; task SG to database TCP/5432; outbound rules are currently broad.
- The observed S3 gateway endpoint `vpce-0be79b16f26533b68` belongs to the separate Control Tower VPC and remains explicitly outside SkyX ownership.

## Controlled design

1. Preserve the Control Tower endpoint outside this repository.
2. Before narrowing egress, collect application dependency evidence for ECR, CloudWatch Logs, STS, Secrets Manager, S3, and any external APIs. Do not infer endpoint requirements from service names alone.
3. If private workload egress is approved, model gateway/interface endpoints one resource at a time, including endpoint subnet placement, endpoint security group, route-table associations, endpoint policy, cost, and failure behavior.
4. Model security-group changes as a complete ingress/egress diff. Do not mix them with listener/TLS, ECS service, database, or migration changes.
5. For every new endpoint or rule, produce a change set with no replacement/deletion of the VPC, subnets, route tables, or existing security groups unless separately approved.

## Gate

The next required inputs are workload dependency evidence, private-egress/cost decision, endpoint policy, and maintenance window. Until those exist, the read-only inventory is the authoritative state and no network hardening is authorized.
