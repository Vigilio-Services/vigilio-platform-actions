# Matriz de workflows

| Workflow | Uso | Consumidores |
| --- | --- | --- |
| `shared-backend-node-nest-ci.yml` | CI backend Nest/Node | `bus-impl`, futuros backend Node |
| `shared-backend-node-nest-deploy-cdk.yml` | Deploy AWS CDK por stage | backends con CDK |
| `shared-container-build-push.yml` | Build OCI multi-arquitectura por revisión exacta, SBOM, provenance, firma y scan | servicios en contenedores |
| `shared-terraform-plan.yml` | Plan AWS con OIDC, políticas y evidencia redactada | repositorios Terraform |
| `shared-terraform-apply.yml` | Plan y apply exactos dentro de un environment protegido | repositorios Terraform |
| `shared-helm-kubernetes-ci.yml` | Helm lint/template, Kustomize, Kubeconform y Trivy | workloads Kubernetes |
| `shared-gitops-promote.yml` | PR de promoción por digest inmutable | aplicaciones reconciliadas por Argo CD |
| `shared-web-mfe-preact-ci.yml` | CI web MFE Vite/Preact con contratos backend, config/runtime, skills, visuales y CDK opcionales | `web-mfe`, `web-mfe-v2`, futuros web |
| `shared-web-mfe-deploy-s3-cloudfront.yml` | Deploy estatico S3/CloudFront | web MFE en AWS |
| `shared-mobile-expo-ci.yml` | CI Expo rapido | `mobile-mfe`, futuros mobile |
| `shared-mobile-expo-eas-build.yml` | Build EAS gobernado | mobile releases |
| `shared-mobile-expo-security.yml` | CodeQL, secretos, Semgrep y Trivy | mobile MFE |
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
