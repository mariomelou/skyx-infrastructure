# SkyX WAF component design — 2026-09-12

## Status

`PREPARADO / NÃO APLICADO`. This opt-in component creates a regional WAFv2 Web ACL and associates it with the two existing public ALBs. It is observation-only: the first component accepts `wafMode=count` and rejects blocking mode.

## Resources and ownership boundary

The template creates one `AWS::WAFv2::WebACL` and two `AWS::WAFv2::WebACLAssociation` resources. It references the existing API and frontend ALB ARNs and does not create/adopt ALBs, logging destinations, ECS resources, or application roles.

The Web ACL has default allow and two AWS-managed rule groups:

- `AWSManagedRulesCommonRuleSet`
- `AWSManagedRulesKnownBadInputsRuleSet`

Both rule groups use `OverrideAction: Count`, so this first component does not block requests. WAF logging is intentionally omitted until a destination, retention, cost owner, and incident workflow are approved.

## Validation and gate

```bash
npm run verify:waf
```

The verifier proves that the template contains exactly one regional COUNT Web ACL, both intended ALB associations, and no logging or ALB ownership. Applying it still requires a reviewed diff/change set, false-positive observation plan, logging decision, maintenance window, protected GitHub environment, and explicit approval.
