#!/usr/bin/env bash
set -e

: "${AWS_REGION:?Missing AWS_REGION}"
: "${ECS_CLUSTER:?Missing ECS_CLUSTER}"
: "${ECS_SERVICE:?Missing ECS_SERVICE}"
: "${TASK_FAMILY:?Missing TASK_FAMILY}"
: "${IMAGE_URI:?Missing IMAGE_URI}"

echo "Deploying $IMAGE_URI to $ECS_SERVICE..."

TASK_DEF=$(aws ecs describe-task-definition \
  --task-definition "$TASK_FAMILY" \
  --region "$AWS_REGION")

NEW_TASK_DEF=$(echo "$TASK_DEF" | \
  jq --arg IMAGE "$IMAGE_URI" \
  '.taskDefinition
   | del(
       .taskDefinitionArn,
       .revision,
       .status,
       .requiresAttributes,
       .compatibilities,
       .registeredAt,
       .registeredBy
     )
   | .containerDefinitions[0].image = $IMAGE')

NEW_TASK_DEF_ARN=$(aws ecs register-task-definition \
  --region "$AWS_REGION" \
  --cli-input-json "$NEW_TASK_DEF" \
  --query 'taskDefinition.taskDefinitionArn' \
  --output text)

aws ecs update-service \
  --cluster "$ECS_CLUSTER" \
  --service "$ECS_SERVICE" \
  --task-definition "$NEW_TASK_DEF_ARN" \
  --region "$AWS_REGION"

echo "Deployment complete!"
