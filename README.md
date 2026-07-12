# vigilio-platform-actions

Repositorio central de workflows reutilizables, composite actions y governance scripts para proyectos Vigilio.

Objetivo: que `bus-impl`, `web-mfe`, `mobile-mfe`, `tauri-mfe` y futuros repos consuman CI/CD consistente sin duplicar YAML pesado.

## Estructura

```text
.github/workflows/                 reusable workflows
actions/                           composite actions
packages/devsecops-governance/     paquete npm TypeScript
docs/                              documentacion de plataforma
```

## Uso rapido

Backend Nest:

```yaml
jobs:
  ci:
    uses: VigilioYonatan/vigilio-platform-actions/.github/workflows/shared-backend-node-nest-ci.yml@87fe5c0890d6a1b639ce00431bf10d92453fdda2 # v1
    with:
      node-version: '24.16.0'
      pnpm-version: '11.5.2'
      has-postgres: true
      has-cdk: true
      has-openapi: true
    secrets: inherit
```

Backend Nest + CDK deploy:

```yaml
jobs:
  deploy-production:
    if: github.ref_name == 'main'
    uses: VigilioYonatan/vigilio-platform-actions/.github/workflows/shared-backend-node-nest-deploy-cdk.yml@87fe5c0890d6a1b639ce00431bf10d92453fdda2 # v1
    with:
      app-name: bus-impl
      stage: production
      deploy-mode: apply
      run-smoke: true
      attest-artifact: true
      cdk-deploy-command: pnpm cdk deploy --all --require-approval broadening --outputs-file reports/cdk-outputs-production.json
    secrets: inherit
```

Jira DevOps automation:

```yaml
steps:
  - uses: VigilioYonatan/vigilio-platform-actions/actions/jira-devops@87fe5c0890d6a1b639ce00431bf10d92453fdda2 # v1
    with:
      mode: deployment
      issue-keys: ABC-123
      environment: staging
      app-name: bus-impl
      pipeline-url: ${{ github.server_url }}/${{ github.repository }}/actions/runs/${{ github.run_id }}
    env:
      JIRA_BASE_URL: ${{ secrets.JIRA_BASE_URL }}
      JIRA_USER_EMAIL: ${{ secrets.JIRA_USER_EMAIL }}
      JIRA_API_TOKEN: ${{ secrets.JIRA_API_TOKEN }}
```

Modos disponibles: `deployment`, `transition`, `release`, `incident`, `smart-commit` y `feature-flag`.

Web MFE:

```yaml
jobs:
  ci:
    uses: VigilioYonatan/vigilio-platform-actions/.github/workflows/shared-web-mfe-preact-ci.yml@87fe5c0890d6a1b639ce00431bf10d92453fdda2 # v1
    with:
      node-version: '24.16.0'
      pnpm-version: '11.5.2'
    secrets: inherit
```

Mobile Expo:

```yaml
jobs:
  ci:
    uses: VigilioYonatan/vigilio-platform-actions/.github/workflows/shared-mobile-expo-ci.yml@87fe5c0890d6a1b639ce00431bf10d92453fdda2 # v1
    with:
      node-version: '24.16.0'
      pnpm-version: '11.5.2'
    secrets: inherit
```

Tauri:

```yaml
jobs:
  ci:
    uses: VigilioYonatan/vigilio-platform-actions/.github/workflows/shared-desktop-tauri-ci.yml@87fe5c0890d6a1b639ce00431bf10d92453fdda2 # v1
    with:
      node-version: '24.16.0'
      pnpm-version: '11.5.2'
    secrets: inherit
```

## Reglas

- Consumir actions y workflows remotos por SHA completo, con el tag de release como comentario.
- Actualizar SHAs mediante PR de Dependabot; nunca mover consumidores silenciosamente.
- En trunk-based, los deploys compartidos `development`, `test`, `staging`, `preproduction` y `production` salen desde `main`.
- Los secrets viven en el repo consumidor, organization secrets o GitHub Environments.
- Este repo central no guarda credenciales.
- Los workflows por stack son separados; no hay workflow gigante universal.
- Jira se integra como accion reusable opcional; si faltan credenciales y `required=false`, se salta sin romper CI.
- Backend CDK construye una vez, verifica SHA-256 y despliega el mismo `cdk.out`; attestation y DAST son opt-in por compatibilidad.

## Comandos

```bash
# Verifica el estilo y busca errores en el código (Biome)
pnpm lint

# Verifica la integridad de los tipos estáticos de TypeScript
pnpm typecheck

# Ejecuta las pruebas unitarias (Vitest) en todos los paquetes
pnpm test

# Compila todos los paquetes del monorepo de forma recursiva y en paralelo
pnpm build

# Genera los archivos para publicar una nueva versión (Changesets)
pnpm changeset

# Verifica que todos los Reusable Workflows cumplan las reglas de seguridad
pnpm governance:workflows

# Verifica que todas las GitHub Custom Actions cumplan el estándar
pnpm governance:actions
```

## Documentacion

- [Arquitectura](./docs/01-arquitectura.md)
- [Versionado](./docs/02-versionado.md)
- [Seguridad](./docs/03-seguridad.md)
- [Como consumir workflows](./docs/04-como-consumir.md)
- [Matriz de workflows](./docs/05-matriz-workflows.md)
- [Paquete DevSecOps Governance](./docs/06-paquete-devsecops-governance.md)
