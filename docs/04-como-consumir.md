# Como consumir workflows

## Backend Nest

```yaml
name: bus-impl-ci

on:
  pull_request:
    branches: [develop, main, 'release/**']
  push:
    branches: [develop, main, 'release/**']

jobs:
  ci:
    uses: vigilio/vigilio-platform-actions/.github/workflows/shared-backend-node-nest-ci.yml@v1
    with:
      has-postgres: true
      has-cdk: true
      has-openapi: true
    secrets: inherit
```

## Deploy CDK

```yaml
jobs:
  deploy:
    uses: vigilio/vigilio-platform-actions/.github/workflows/shared-backend-node-nest-deploy-cdk.yml@v1
    with:
      stage: production
      deploy-mode: plan
    secrets:
      AWS_ROLE_ARN: ${{ secrets.AWS_PROD_ROLE_ARN }}
```

## Web MFE

```yaml
jobs:
  ci:
    uses: vigilio/vigilio-platform-actions/.github/workflows/shared-web-mfe-preact-ci.yml@v1
    secrets: inherit
```

## Web Deploy

```yaml
jobs:
  deploy:
    uses: vigilio/vigilio-platform-actions/.github/workflows/shared-web-mfe-deploy-s3-cloudfront.yml@v1
    with:
      stage: staging
    secrets:
      AWS_ROLE_ARN: ${{ secrets.AWS_STAGING_ROLE_ARN }}
      WEB_BUCKET: ${{ secrets.WEB_BUCKET }}
      CLOUDFRONT_DISTRIBUTION_ID: ${{ secrets.CLOUDFRONT_DISTRIBUTION_ID }}
```

## Mobile Expo

```yaml
jobs:
  ci:
    uses: vigilio/vigilio-platform-actions/.github/workflows/shared-mobile-expo-ci.yml@v1
    secrets: inherit
```

## EAS Build

```yaml
jobs:
  build:
    uses: vigilio/vigilio-platform-actions/.github/workflows/shared-mobile-expo-eas-build.yml@v1
    with:
      profile: test
      platform: android
    secrets:
      EXPO_TOKEN: ${{ secrets.EXPO_TOKEN }}
```

## Tauri

```yaml
jobs:
  ci:
    uses: vigilio/vigilio-platform-actions/.github/workflows/shared-desktop-tauri-ci.yml@v1
```

## Tauri Build

```yaml
jobs:
  build:
    uses: vigilio/vigilio-platform-actions/.github/workflows/desktop-tauri-build.yml@v1
    with:
      stage: production
    secrets:
      VITE_API_BASE_URL: ${{ secrets.VITE_API_BASE_URL }}
```
