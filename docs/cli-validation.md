# AWS CLI validation runbook

This repository must use the `skyx` profile for AWS validation. The profile is configured for account `129346407469`, role `AWSPowerUserAccess`, and region `us-east-1`.

## Renew the SSO session

Use the AWS CLI profile explicitly:

```bash
aws sso login --profile skyx --use-device-code --no-browser
```

If the CLI prints a device URL and code, complete it in the Chrome profile **Mario Melo Studio**, using the SkyX access portal [https://d-9066763dce.awsapps.com/start](https://d-9066763dce.awsapps.com/start). Do not use the Codex in-app browser, another Chrome profile, or the `default` AWS profile, which targets account `250879721047`. The portal account is `sandbox` (`129346407469`) and the validated role is `AWSPowerUserAccess`.

## Verify identity before CDK

```bash
aws sts get-caller-identity --profile skyx
```

The returned `Account` must be exactly `129346407469`, and the assumed role should be `AWSReservedSSO_AWSPowerUserAccess_.../mario`. If token refresh fails, stop there; do not run the diff with another profile or with production credentials copied into the shell.

## Run the bounded validation

```bash
npm test
npm run diff -- --profile skyx
```

`npm test` is local-only (type-check, synth, and the read-only manifest invariant check). The CDK diff is the AWS-dependent gate and must be reviewed for replacements, deletions, imports, or unexpected changes before any future ownership work. An authenticated diff may publish its generated template asset to existing CDK bootstrap storage; it must not create the adoption stack or application resources.
