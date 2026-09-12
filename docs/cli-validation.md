# AWS CLI validation runbook

This repository must use the `skyx` profile for AWS validation. The profile is configured for account `129346407469`, role `AdministratorAccess`, and region `us-east-1`.

## Renew the SSO session

Use the AWS CLI profile explicitly:

```bash
aws sso login --profile skyx --no-browser
```

If the CLI prints a device URL and code, open that URL in the Chrome profile **Mario Melo Studio**. Do not use the other Chrome profile and do not use the `default` AWS profile, which targets account `250879721047`.

## Verify identity before CDK

```bash
aws sts get-caller-identity --profile skyx
```

The returned `Account` must be exactly `129346407469`. If token refresh fails, stop there; do not run the diff with another profile or with production credentials copied into the shell.

## Run the bounded validation

```bash
npm test
npm run diff -- --profile skyx
```

`npm test` is local-only (type-check, synth, and the read-only manifest invariant check). The CDK diff is the AWS-dependent gate and must be reviewed for replacements, deletions, imports, or unexpected changes before any future ownership work.
