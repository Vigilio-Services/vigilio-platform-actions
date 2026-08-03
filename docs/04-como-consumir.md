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

## Backend Nest en EKS con Terraform

El CI de Node existente se consume con `has-cdk: false`. Terraform, contenedores, Helm y promoción GitOps usan workflows independientes para no mezclar ciclos de vida.

```yaml
jobs:
  terraform-plan:
    uses: VigilioYonatan/vigilio-platform-actions/.github/workflows/shared-terraform-plan.yml@REPLACE_WITH_RELEASE_SHA
    with:
      working-directory: infra/environments/aws/development
      backend-config: backend.hcl
      var-file: development.tfvars
    secrets:
      AWS_ROLE_ARN: ${{ secrets.AWS_TERRAFORM_PLAN_ROLE_ARN }}
```

El workflow de apply vuelve a crear el plan y aplica exactamente ese archivo dentro del mismo job protegido. Los planes binarios y JSON no se publican porque pueden contener datos sensibles.

```yaml
jobs:
  kubernetes:
    uses: VigilioYonatan/vigilio-platform-actions/.github/workflows/shared-helm-kubernetes-ci.yml@REPLACE_WITH_RELEASE_SHA
    with:
      chart-directory: deploy/helm/bus-impl-v2
      minimal-values: deploy/helm/bus-impl-v2/tests/values-minimal.yaml
      production-values: deploy/helm/bus-impl-v2/tests/values-production.yaml
```

Después de publicar y firmar la imagen, `shared-gitops-promote.yml` abre un PR que modifica únicamente `image.digest`. Nunca actualiza producción directamente.

## Web MFE

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
