#!/bin/sh
set -e

SECRET_JSON=$(aws secretsmanager get-secret-value \
  --secret-id myapp/prod/google \
  --query SecretString \
  --output text)

export GOOGLE_CLIENT_ID=$(echo "$SECRET_JSON" | jq -r '.GOOGLE_CLIENT_ID')
export GOOGLE_CLIENT_SECRET=$(echo "$SECRET_JSON" | jq -r '.GOOGLE_CLIENT_SECRET')

# Now start the release
/app/bin/myapp start
