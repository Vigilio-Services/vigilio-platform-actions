---
name: coderabbit-compliance
description: Review compliance risks for CodeRabbit and DevSecOps based on evidence and the policies of the consumer repository across TypeScript source, Vitest tests, GitHub Actions workflows, CodeQL rules, and package manifests. Use when creating or modifying workflows, governance policies, unit tests, regex patterns, or package dependencies.
owner: governance-platform
lifecycle: stable
introduced_in: 0.7.0
routing_ecosystems: "cross-stack"
routing_keywords: "engineering, standards, governance, coderabbit-compliance"
routing_files: "package.json"
routing_capabilities: "engineering-standards, governance"
requires: []
optional: []
conflicts: []
supersedes: []
---

# CodeRabbit Compliance & DevSecOps Rules

Aplicar controles DevSecOps y supply-chain según el riesgo y la autoridad del consumidor. No prometer aprobación automática ni imponer preferencias como si fueran normas universales.

## Guardrails Overview

### 1. TypeScript Source Code (`src/**/*.ts`)
- **Strict Typing:** PROHIBIDO el uso de `any`. Exigir siempre `unknown`, interfaces explícitas y type guards.
- **Error Logging:** PROHIBIDO usar `console.log` para errores de runtime. Exigir excepciones estructuradas o logger centralizado (`logger.error(...)`).
- **No Bypasses in Policies:** Validar que la lógica de gobernanza no tenga rutas de escape condicionales falsas (p. ej. usar el autor del PR para validar todos los commits de un `git log`). Cada objeto/commit debe validarse de forma individual.
- **Async File Operations:** Usar `node:fs/promises` (`async/await`) en lugar de funciones síncronas bloqueantes (`readFileSync`, `writeFileSync`).
- **ReDoS Prevention:** Mitigar ReDoS en patrones aplicados a entradas no confiables con análisis del patrón y límites de input; `+` no es intrínsecamente inseguro ni `{1,10}` garantiza seguridad.
- **Command Injection Prevention:** PROHIBIDO construir ejecutables `spawn`/`exec` a partir de `process.env[...]` sin sanear. Usar binarios o comandos literales (ej. `'cmd.exe'`, `'pnpm'`).

### 2. Unit Tests (`tests/**/*.ts`)
- **Assertions:** Elegir `toStrictEqual()` o `toEqual()` según el contrato y las diferencias que se necesite detectar; no imponer un matcher universal.
- **System Mocks:** Mockear llamadas al sistema (`fs`, `exec`, `spawn`) para evitar efectos secundarios en CI.
- **Pruebas basadas en riesgo:** exigir pruebas del comportamiento cambiado, incluidos casos de borde relevantes; no una prueba por archivo como dogma.

### 3. GitHub Actions Workflows (`.github/workflows/*.yml`)
- **Action Pinning:** Fijar el commit SHA completo en acciones de terceros (ej. `uses: aquasecurity/trivy-action@<commit-sha> # v0.36.0`).
- **Principle of Least Privilege (PoLP):** PROHIBIDO el uso de `permissions: write-all`. Definir permisos mínimos a nivel de job o agregar comentarios explicativos en los permisos requeridos (`# Required for AWS OIDC`, `# Required for SARIF upload`).
- **Inline Script Hardening:** Para scripts Bash complejos, usar `set -euo pipefail` cuando corresponda; no imponerlo a shells que no lo soportan.
- **Pre-signing Security Gates:** Escanear imágenes (Trivy/CodeQL) ANTES de firmar (Cosign) o publicar artefactos en producción.
- **Build Digest Export:** Configurar `load: ${{ !inputs.push }}` en `docker/build-push-action` para que `outputs.digest` se pueble adecuadamente cuando `push=false`.

### 4. Package Manifests (`package.json` & `pnpm-workspace.yaml`)
- **Pinned Dependencies:** Mantener dependencias críticas de plataforma fijas sin caracteres flotantes (`^` o `~`).
- **Deterministic Commands:** Comandos de build y test determinísticos usando cache de pnpm y congelando versiones de herramientas.

## Validation Checklist

Antes de commitear o crear PR, verificar:
1. `pnpm format` (Biome format) ejecutado.
2. `pnpm lint` (Biome check) verde.
3. tests pertinentes del proyecto (Vitest cuando aplica), con aserciones adecuadas y evidencia.
4. `pnpm governance` (Workflow & Ruleset validation) verde.

> Fuente única para **Correcto / Incorrecto: manejo de existente**: [abrir documento canónico](../.vigilio-docs/standards/engineering/refactoring-existing-code.md).

## ✅ Correcto / ❌ Incorrecto — tarea `coderabbit-compliance`

✅ **Correcto:** en esta tarea, aplicar criterios verificables específicos de esta guía y consultar su owner canónico; remitir la norma compartida al documento propietario.

❌ **Incorrecto:** en esta tarea, copiar reglas de otro stack o declarar evidencia sin haberla ejecutado; inventar pruebas o pegar el mismo procedimiento transversal en varias skills.

