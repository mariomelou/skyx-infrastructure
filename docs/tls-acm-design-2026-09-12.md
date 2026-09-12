# SkyX ACM/TLS and listener design — 2026-09-12

## Status

`BLOQUEADO POR DECISÃO DE DOMÍNIO / NÃO APLICADO`. Both public ALBs currently expose HTTP:80; no ACM certificate was observed in `us-east-1`. No listener, DNS, certificate, or application URL was changed.

## Required external decisions

- Canonical frontend hostname and API hostname.
- DNS zone/account ownership and who can publish ACM DNS validation records.
- Whether certificates are separate host certificates or a reviewed wildcard/SAN certificate.
- Certificate renewal owner and alert destination.
- Whether the rollout may include an HTTP-to-HTTPS redirect immediately or needs a compatibility window.

No hostname or certificate ARN is invented in IaC until these decisions are provided.

## Controlled sequence

1. Validate domain ownership and request ACM certificates in `us-east-1`, because the ALBs are regional.
2. Verify certificate status and SAN/hostname coverage; record the certificate ARN and renewal evidence.
3. Prepare a listener change set that adds HTTPS:443 with the reviewed TLS policy and certificate, preserves the existing target groups/rules, and adds HTTP-to-HTTPS redirects only when approved.
4. Update frontend/backend release contracts from raw HTTP ALB URLs to the canonical HTTPS hostnames. This application rollout is separate from backend migrations.
5. Test redirects, API/auth flows, health checks, target-group behavior, certificate renewal, and rollback before considering the change complete.

## Gate

The required evidence is the domain/DNS decision, validated certificate, listener diff, application URL diff, rollout plan, and rollback plan. Until then, the HTTP listener inventory remains `PROVADO` and TLS remains `PENDENTE / AGUARDANDO DECISÃO`.
