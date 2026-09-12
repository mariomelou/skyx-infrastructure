# SkyX ECS autoscaling component design — 2026-09-12

## Status

`PREPARADO / NÃO APLICADO`. This opt-in component defines Application Auto Scaling resources for the two existing ECS services. It does not adopt or recreate either `AWS::ECS::Service`.

## Required explicit inputs

```text
hardeningComponent=ecs-scaling
apiMinCapacity=<approved minimum>
apiMaxCapacity=<approved maximum>
apiTargetCpu=<approved CPU target percentage>
frontendMinCapacity=<approved minimum>
frontendMaxCapacity=<approved maximum>
frontendTargetCpu=<approved CPU target percentage>
```

The component rejects missing or non-positive values, maximum capacity below minimum capacity, and CPU targets above 100. The first local verification uses `1/4/60` for the API and `1/3/60` for the frontend only as test inputs, not as production approval.

## Resources and ownership boundary

The generated template contains two `AWS::ApplicationAutoScaling::ScalableTarget` resources with resource IDs `service/skyx-prod/skyx-api` and `service/skyx-prod/skyx-frontend`, plus one target-tracking `AWS::ApplicationAutoScaling::ScalingPolicy` per service using `ECSServiceAverageCPUUtilization`. It does not create an IAM role; Application Auto Scaling uses the service-linked role boundary when the change is approved.

Scale-out cooldown is 60 seconds and scale-in cooldown is 300 seconds. These defaults require operational review together with capacity, budget, and load evidence.

## Circuit breaker separation

The ECS deployment circuit breaker remains a separate change to the existing ECS service configuration. It must not be combined with autoscaling because it changes rollout and rollback behavior and requires a tested failure alarm signal.

## Validation and gate

```bash
npm run verify:ecs-scaling
```

The verifier proves that only two scalable targets and two CPU policies are synthesized. Applying them still requires a reviewed diff/change set, capacity/load/budget approval, the protected GitHub `production` environment, and explicit approval.
