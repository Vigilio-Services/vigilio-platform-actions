---
name: coderabbit-compliance
description: Ensure 100% first-pass compliance with CodeRabbit (assertive Staff Engineer DevSecOps profile) across TypeScript source, Vitest tests, GitHub Actions workflows, CodeQL rules, and package manifests. Use when creating or modifying workflows, governance policies, unit tests, regex patterns, or package dependencies.
---

# CodeRabbit Compliance & DevSecOps Rules

Enforce strict DevSecOps, supply-chain security, and CodeRabbit review guardrails on every code edit to prevent PR review blocks.

## Guardrails Overview

### 1. TypeScript Source Code (`src/**/*.ts`)
- **Strict Typing:** PROHIBIDO el uso de `any`. Exigir siempre `unknown`, interfaces explícitas y type guards.
- **Error Logging:** PROHIBIDO usar `console.log` para errores de runtime. Exigir excepciones estructuradas o logger centralizado (`logger.error(...)`).
- **No Bypasses in Policies:** Validar que la lógica de gobernanza no tenga rutas de escape condicionales falsas (p. ej. usar el autor del PR para validar todos los commits de un `git log`). Cada objeto/commit debe validarse de forma individual.
- **Async File Operations:** Usar `node:fs/promises` (`async/await`) en lugar de funciones síncronas bloqueantes (`readFileSync`, `writeFileSync`).
- **ReDoS Prevention:** PROHIBIDO usar expresiones regulares sin cuantificadores acotados en entradas no controladas. Usar `{1,10}` o `{1,8}` en lugar de `+` descontrolados para prevenir ReDoS (Polynomial Regular Expressions).
- **Command Injection Prevention:** PROHIBIDO construir ejecutables `spawn`/`exec` a partir de `process.env[...]` sin sanear. Usar binarios o comandos literales (ej. `'cmd.exe'`, `'pnpm'`).

### 2. Unit Tests (`tests/**/*.ts`)
- **Strict Assertions:** Exigir aserciones estrictas `toStrictEqual(...)` en lugar de `toEqual(...)`.
- **System Mocks:** Mockear llamadas al sistema (`fs`, `exec`, `spawn`) para evitar efectos secundarios en CI.
- **1-to-1 Test Coverage:** Si se crea o modifica un archivo en `src/`, EXIGIR que exista su archivo de test adyacente o correspondiente en `tests/` cubriendo los casos de borde.

### 3. GitHub Actions Workflows (`.github/workflows/*.yml`)
- **Action Pinning:** Fijar el commit SHA completo en acciones de terceros (ej. `uses: aquasecurity/trivy-action@<commit-sha> # v0.36.0`).
- **Principle of Least Privilege (PoLP):** PROHIBIDO el uso de `permissions: write-all`. Definir permisos mínimos a nivel de job o agregar comentarios explicativos en los permisos requeridos (`# Required for AWS OIDC`, `# Required for SARIF upload`).
- **Inline Script Hardening:** En bloques multilínea `run: |`, incluir SIEMPRE `set -euo pipefail` como primera instrucción.
- **Pre-signing Security Gates:** Escanear imágenes (Trivy/CodeQL) ANTES de firmar (Cosign) o publicar artefactos en producción.
- **Build Digest Export:** Configurar `load: ${{ !inputs.push }}` en `docker/build-push-action` para que `outputs.digest` se pueble adecuadamente cuando `push=false`.

### 4. Package Manifests (`package.json` & `pnpm-workspace.yaml`)
- **Pinned Dependencies:** Mantener dependencias críticas de plataforma fijas sin caracteres flotantes (`^` o `~`).
- **Deterministic Commands:** Comandos de build y test determinísticos usando cache de pnpm y congelando versiones de herramientas.

## Validation Checklist

Antes de commitear o crear PR, verificar:
1. `pnpm format` (Biome format) ejecutado.
2. `pnpm lint` (Biome check) verde.
3. `pnpm test` (Vitest `toStrictEqual`) verde.
4. `pnpm governance` (Workflow & Ruleset validation) verde.
