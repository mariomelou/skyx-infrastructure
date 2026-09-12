# SkyX AWS Config ownership design — 2026-09-12

## Status

`PROVADO COMO OWNERSHIP EXTERNO / NÃO APLICADO`. AWS Config recorder and delivery settings are active under the Control Tower boundary. This repository does not recreate or modify those resources.

## Controlled boundary

Before any Config change, identify the Control Tower management account/owner, recorder and delivery-channel physical IDs, retention settings, and managed-rule ownership. Do not create a second recorder, delivery channel, or duplicate managed rules in the SkyX stack.

If a SkyX-specific rule or exception is requested, prepare it as a separate, named resource with an explicit compliance owner, scope, cost, remediation behavior, and rollback. Never modify Control Tower-owned resources as an incidental part of an application import or hardening change.

## Gate

The current Config evidence remains read-only and authoritative. A change requires Control Tower owner confirmation, rule/exception design, complete diff, and explicit approval.
