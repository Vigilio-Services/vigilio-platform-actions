---
name: platform-repository-workspace
description: Delimita fronteras entre repositorios en las 3 arquitecturas (sin package.json raíz ni carpeta contracts/), organiza submódulos auditables e impone endurecimiento supply-chain pnpm (packages: []) e higiene de artefactos.
owner: governance-platform
lifecycle: experimental
introduced_in: 0.8.0
routing_ecosystems: "cross-stack"
routing_keywords: "workspace, repository, submodules, polyrepo, multirepo, monorepo, gitmodules, git-hygiene, repository-boundaries, workspace-strategy"
routing_files: ".gitmodules, .gitignore, versions.yaml, pnpm-workspace.yaml, workspace.yaml"
routing_capabilities: "platform-engineering, workspace-management"
requires: []
optional: []
conflicts: []
supersedes: []
---

<skill-content>

# Gobernanza De Repositorios, Fronteras Y Workspaces

## Lectura obligatoria de referencias

Lee completamente [references/canonical-contract.md](references/canonical-contract.md).

Abre cada fuente canónica aplicable.

No cierres gates cuando una fuente requerida resulte inaccesible.

## Flujo

1. **Delimita fronteras según el nivel de arquitectura:**
   - **Nivel 1 (`compose-vps`):** 5 repositorios desacoplados (`apps/<product>-impl`, `apps/<product>-web`, `<product>-deploy`, `platform-ops`, `prod-local`).
   - **Niveles 2 y 3 (Kubernetes GitOps / Cloud AWS):** `apps/*` independientes (o montados por submódulos SHA), `infra/` (estados Terraform separados) y `deploy/` (estado deseado Argo CD; CI de apps jamás recibe `kubeconfig`).
2. **Cero carpeta `contracts/` y cero `package.json` en raíz coordinadora:** Prohíbe crear `contracts/` o `packages/contracts/` manuales; cada módulo de negocio es propietario de sus schemas Zod 4 (`domain/schemas/*.schema.ts`) y DTOs (`presentation/http/dto/*.dto.ts`) con gate `openapi diff` en CI. Nunca coloques `package.json` ni `pnpm-workspace.yaml` en la carpeta raíz que agrupa múltiples repositorios.
3. **Endurecimiento Supply-Chain en cada repo Node (`packages: []`):** En cada repositorio de aplicación usa `pnpm-workspace.yaml` con `packages: []` para imponer `engineStrict: true`, `preferFrozenLockfile: true`, `verifyStoreIntegrity: true`, `strictDepBuilds: true`, `dangerouslyAllowAllBuilds: false`, `minimumReleaseAge: 1440` y lista blanca explícita `allowBuilds`.
4. **Control canónico de herramientas e higiene:** Fija versiones de binarios CLI en `versions.yaml` descargándolos con verificación SHA-256 en `.tools/` (ignorado en Git) y bloquea secretos con `.gitleaks.toml`.

## Qué Hacer Y Qué NO Hacer (Límites Senior)

- ✅ **Hacer:** Mantener lockfiles independientes por repositorio, proteger `main` con `CODEOWNERS` y mantener roles de host (`platform-ops`) libres de nombres o reglas de negocio de un producto.
- ❌ **No hacer:** Ejecutar `pnpm install` en la raíz de un checkout multi-repo, crear carpetas `contracts/` duplicadas, permitir `dangerouslyAllowAllBuilds: true` o comitear ejecutables binarios, `.terraform/`, `.tfstate`, `.logs/`, `.artifacts/`, `coverage/` o dumps SQL.
- ❌ **No hacer:** Anidar repositorios `.git` huérfanos sin control de submódulos ni utilizar versiones flotantes de herramientas en scripts o pipelines.

## Respuesta

Resume primero salud, riesgo y acción.

Usa frases cortas.

Incluye evidencia, costos, pruebas y ejemplos aplicables.

## ✅ Correcto / ❌ Incorrecto: manejo de existente

- ✅ **Correcto:** Estratificar código de app, infraestructura (`platform-ops`/`infra`) y despliegue (`<product>-deploy`/`deploy`) en repositorios independientes con `pnpm-workspace.yaml` endurecido (`packages: []`) y propiedad de DTOs dentro de cada módulo.
- ❌ **Incorrecto:** Mezclar código fuente, estado de Terraform, carpetas `contracts/` paralelas y copias masivas no versionadas en una misma carpeta sin fronteras de CI.
- **Gate:** no reescribir masivamente código heredado; inspeccionar baseline, tests y locks reales; reportar `NOT_RUN` si falta evidencia. La guía de refactor se consulta en `vigilio-docs/standards/engineering/refactoring-existing-code.md` según la revisión de Docs aprobada (no asumir que el link remoto `main` ya esté publicado).

</skill-content>

## Guías de librerías por versión — lectura antes de usar sus APIs

Las versiones de esta skill no se copian aquí: comprobar lockfile y [versión canónica](../.vigilio-docs/technology/versions.md). Cuando la tarea utilice una de estas dependencias, **abrir el `.md` completo** y consultar su migración ✅/❌ antes de escribir código; el resto no es obligatorio para una tarea que no la utiliza.

✅ Correcto: versionar el consumidor y seguir los ejemplos de la API instalada; enlazar documento propietario.  ❌ Incorrecto: copiar APIs legacy, duplicar normas en la skill o instalar nuevas dependencias sin gate.
