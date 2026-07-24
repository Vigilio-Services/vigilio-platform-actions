# Matriz de workflows

| Workflow | Uso | Consumidores |
| --- | --- | --- |
| `shared-backend-node-nest-ci.yml` | CI backend Nest/Node | `bus-impl`, futuros backend Node |
| `shared-backend-node-nest-deploy-cdk.yml` | Deploy AWS CDK por stage | backends con CDK |
| `shared-web-mfe-preact-ci.yml` | CI web MFE Vite/Preact | `web-mfe`, futuros web |
| `shared-web-mfe-deploy-s3-cloudfront.yml` | Deploy estatico S3/CloudFront | web MFE en AWS |
| `shared-mobile-expo-ci.yml` | CI Expo rapido | `mobile-mfe`, futuros mobile |
| `shared-mobile-expo-eas-build.yml` | Build EAS gobernado | mobile releases |
| `shared-desktop-tauri-ci.yml` | CI Tauri + Rust | `tauri-mfe`, futuros desktop |
| `shared-desktop-tauri-build.yml` | Build desktop multi-OS | desktop releases |

## Branch to stage

| Stage | Rama permitida |
| --- | --- |
| `development` | `main` |
| `test` | `main` |
| `staging` | `main` |
| `preproduction` | `main` |
| `production` | `main` |

## Composite actions

| Action | Responsabilidad |
| --- | --- |
| `setup-node-pnpm` | Node, pnpm, cache e install |
| `configure-github-packages` | Auth npm GitHub Packages |
| `validate-stage-source` | Politica rama/stage |
| `install-playwright-chromium` | Chromium rapido para browser tests |
| `jira-devops` | Deployments, transiciones, releases e incidentes Jira |
