# Como consumir workflows

## Backend Nest

```yaml
name: bus-impl-ci

on:
  pull_request:
    branches: [main]
  push:
    branches: [main]

jobs:
  ci:
    uses: VigilioYonatan/vigilio-platform-actions/.github/workflows/shared-backend-node-nest-ci.yml@87fe5c0890d6a1b639ce00431bf10d92453fdda2 # v1
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
    uses: VigilioYonatan/vigilio-platform-actions/.github/workflows/shared-backend-node-nest-deploy-cdk.yml@87fe5c0890d6a1b639ce00431bf10d92453fdda2 # v1
    with:
      stage: production
      deploy-mode: plan
      attest-artifact: true
    secrets: inherit
```

Para staging/preproduction puede activarse `run-dast: true`. En `apply`, smoke es obligatorio para staging, preproduction y production.

## Web MFE

Instalar el tooling web reutilizable con version exacta:

```bash
pnpm add -D --save-exact @vigilioyonatan/web-mfe-tooling@0.1.0
```

El consumidor conserva solo valores de dominio y aliases estables; la implementacion se ejecuta
mediante `vigilio-web` desde `node_modules/.bin`.

```yaml
jobs:
  ci:
    uses: VigilioYonatan/vigilio-platform-actions/.github/workflows/shared-web-mfe-preact-ci.yml@87fe5c0890d6a1b639ce00431bf10d92453fdda2 # v1
    secrets: inherit
```

## Web Deploy

```yaml
jobs:
  deploy:
    uses: VigilioYonatan/vigilio-platform-actions/.github/workflows/shared-web-mfe-deploy-s3-cloudfront.yml@87fe5c0890d6a1b639ce00431bf10d92453fdda2 # v1
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
    uses: VigilioYonatan/vigilio-platform-actions/.github/workflows/shared-mobile-expo-ci.yml@87fe5c0890d6a1b639ce00431bf10d92453fdda2 # v1
    secrets: inherit
```

## EAS Build

```yaml
jobs:
  build:
    uses: VigilioYonatan/vigilio-platform-actions/.github/workflows/shared-mobile-expo-eas-build.yml@87fe5c0890d6a1b639ce00431bf10d92453fdda2 # v1
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
    uses: VigilioYonatan/vigilio-platform-actions/.github/workflows/shared-desktop-tauri-ci.yml@87fe5c0890d6a1b639ce00431bf10d92453fdda2 # v1
```

## Tauri Build

```yaml
jobs:
  build:
    uses: VigilioYonatan/vigilio-platform-actions/.github/workflows/shared-desktop-tauri-build.yml@87fe5c0890d6a1b639ce00431bf10d92453fdda2 # v1
    with:
      stage: production
    secrets:
      VITE_API_BASE_URL: ${{ secrets.VITE_API_BASE_URL }}
```
