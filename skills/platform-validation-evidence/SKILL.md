---
name: platform-validation-evidence
description: Genera y audita evidencia operativa, pruebas de preflight, validación de contratos y matrices de compatibilidad.
owner: governance-platform
lifecycle: experimental
introduced_in: 0.8.0
routing_ecosystems: "cross-stack"
routing_keywords: "evidence, audit, verification, compatibility, preflight, gates, validation-trail"
routing_files: "compatibility.json, COMPATIBILITY.md, package.json"
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

1. Ejecuta validaciones estáticas y preflights antes de cualquier cambio operacional.
2. Recopila hashes criptográficos de configuración, dependencias y matrices de compatibilidad.
3. Verifica contratos entre servicios consumidores y proveedores.
4. Registra trazas de auditoría inmutables vinculadas a tickets Jira o PRs aprobados.
5. Emite reportes de estado deterministas indicando PASS o bloqueando en fail-closed.

## Límites

- No declarar gates aprobados sin evidencia auditable.
- No omitir validaciones de compatibilidad entre repositorios interdependientes.
- No almacenar evidencia con información sensible o PII sin encriptar.

## Respuesta

Resume primero salud, riesgo y acción.

Usa frases cortas.

Incluye evidencia, costos, pruebas y ejemplos aplicables.

## ✅ Correcto / ❌ Incorrecto: manejo de existente

- ✅ **Correcto:** Registrar evidencia criptográfica de pruebas, contratos y hashes de artefactos en matrices de compatibilidad versionadas.
- ❌ **Incorrecto:** Asumir compatibilidad entre microservicios sin pruebas de preflight automatizadas ni verificación de esquemas.
- **Gate:** no reescribir masivamente código heredado; inspeccionar baseline, tests y locks reales; reportar `NOT_RUN` si falta evidencia. La guía de refactor se consulta en `vigilio-docs/standards/engineering/refactoring-existing-code.md` según la revisión de Docs aprobada (no asumir que el link remoto `main` ya esté publicado).

</skill-content>

## Guías de librerías por versión — lectura antes de usar sus APIs

Las versiones de esta skill no se copian aquí: comprobar lockfile y [versión canónica](../.vigilio-docs/technology/versions.md). Cuando la tarea utilice una de estas dependencias, **abrir el `.md` completo** y consultar su migración ✅/❌ antes de escribir código; el resto no es obligatorio para una tarea que no la utiliza.

✅ Correcto: versionar el consumidor y seguir los ejemplos de la API instalada; enlazar documento propietario.  ❌ Incorrecto: copiar APIs legacy, duplicar normas en la skill o instalar nuevas dependencias sin gate.