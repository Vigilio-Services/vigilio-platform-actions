---
name: platform-validation-evidence
description: Genera y audita evidencia operativa determinista (PASS, FAIL, NOT_RUN, BLOCKED), preflights, compatibilidad OpenAPI sin carpeta contracts/ y trazabilidad DORA/auditoría.
owner: governance-platform
lifecycle: experimental
introduced_in: 0.8.0
routing_ecosystems: "cross-stack"
routing_keywords: "evidence, operational-evidence, compatibility-matrix, preflight, audit-evidence, validation-trail, verification-gate, compatibility, dora, compatibilidad, auditoria"
routing_files: "compatibility.json, COMPATIBILITY.md, package.json, reports/operational-evidence.json"
routing_capabilities: "governance, audit-evidence"
requires: []
optional: []
conflicts: []
supersedes: []
---

<skill-content>

# Validación Y Evidencia Operativa

## Lectura obligatoria de referencias

Lee completamente [references/canonical-contract.md](references/canonical-contract.md).

Abre cada fuente canónica aplicable.

No cierres gates cuando una fuente requerida resulte inaccesible.

## Flujo

1. Ejecuta validaciones estáticas y preflights antes de cualquier cambio operacional (interpolación `compose config`, `helm template`/`kustomize build`, `terraform validate/test`, `promtool test rules`, `conftest`).
2. Recopila hashes SHA-256 de artefactos OCI, planes IaC, SBOMs, contratos de red y matrices de compatibilidad (`compatibility.json` / `COMPATIBILITY.md`) vinculadas al commit exacto.
3. Verifica compatibilidad entre servicios mediante `openapi diff` automatizado contra el artefacto OpenAPI generado por cada módulo propietario (prohibido mantener carpetas `contracts/` o `packages/contracts/` manuales).
4. Distingue con rigor de ingeniería entre **validado estáticamente en repositorio**, **probado en laboratorio local (`prod-local`)** y **demostrado en producción real** (restore drills PITR, SLOs vivos, mTLS/WireGuard, Tetragon enforce).
5. Emite reportes deterministas (`reports/operational-evidence.json`) libres de PII/secretos usando exclusivamente los estados `PASS`, `FAIL`, `NOT_RUN` o `BLOCKED` en modo fail-closed.

## Qué Hacer Y Qué NO Hacer (Senior Mode)

- ✅ **Hacer:** Reportar honestamente `NOT_RUN` o `BLOCKED` cuando un clúster, cuenta cloud, bucket S3 o kernel eBPF no está disponible en la sesión actual, adjuntando qué se verificó estáticamente y qué falta ejecutar.
- ❌ **No hacer:** Fabricar estados `PASS`, declarar un sistema "100% production-ready" solo porque los YAML/Markdown existen, volcar variables de entorno o PII en archivos de evidencia o crear directorios `contracts/` duplicados.

## Respuesta

Resume primero salud, riesgo y acción.

Usa frases cortas.

Incluye evidencia, costos, pruebas y ejemplos aplicables.

## ✅ Correcto / ❌ Incorrecto: manejo de existente

- ✅ **Correcto:** Registrar evidencia criptográfica de preflights, `openapi diff`, restore drills y hashes de artefactos diferenciando validación estática de verificación en vivo (`PASS` vs `NOT_RUN`).
- ❌ **Incorrecto:** Asumir compatibilidad sin preflight automatizado, ocultar controles no ejecutados bajo un `PASS` global o guardar secretos en los reportes JSON.
- **Gate:** no reescribir masivamente código heredado; inspeccionar baseline, tests y locks reales; reportar `NOT_RUN` si falta evidencia. La guía de refactor se consulta en `vigilio-docs/standards/engineering/refactoring-existing-code.md` según la revisión de Docs aprobada (no asumir que el link remoto `main` ya esté publicado).

</skill-content>

## Guías de librerías por versión — lectura antes de usar sus APIs

Las versiones de esta skill no se copian aquí: comprobar lockfile y [versión canónica](../.vigilio-docs/technology/versions.md). Cuando la tarea utilice una de estas dependencias, **abrir el `.md` completo** y consultar su migración ✅/❌ antes de escribir código; el resto no es obligatorio para una tarea que no la utiliza.

✅ Correcto: versionar el consumidor y seguir los ejemplos de la API instalada; enlazar documento propietario.  ❌ Incorrecto: copiar APIs legacy, duplicar normas en la skill o instalar nuevas dependencias sin gate.