---
name: architecture-traceability
description: Mantiene trazabilidad entre documentación canónica, implementación, OpenSpec, skills, versiones, propietarios y evidencia. Usar al introducir capacidades, publicar tooling, archivar cambios o revisar drift entre repositorios.
owner: governance-platform
lifecycle: stable
introduced_in: 0.7.0
routing_ecosystems: "cross-stack"
routing_keywords: "engineering, standards, governance, architecture-traceability"
routing_files: "package.json"
routing_capabilities: "engineering-standards, governance"
requires: []
optional: []
conflicts: []
supersedes: []
---

<skill-content>

# Trazabilidad Arquitectónica

## Navegación canónica multistack 2026

Consultar [índice oficial NestJS](../.vigilio-docs/stacks/backend/nestjs/README.md) y [reglas de referencias entre stacks](../.vigilio-docs/governance/documentation-dry-and-ownership.md). Cada referencia técnica conserva solo los enlaces necesarios para su tarea.

## Lectura obligatoria de referencias

Lee completamente [references/capability-matrix.md](references/capability-matrix.md).

Abre cada fuente canónica aplicable.

No cierres gates cuando una fuente requerida resulte inaccesible.

## Flujo

1. Asigna un identificador estable.
2. Enlaza el documento canónico.
3. Enlaza implementación ejecutable.
4. Enlaza cambio OpenSpec activo.
5. Enlaza skill reutilizable.
6. Registra estado, versión y propietario.
7. Registra pruebas y evidencia operacional.
8. Valida rutas y versiones automáticamente.
9. Corrige drift dentro del mismo cambio.
10. Archiva referencias temporales al cerrar OpenSpec.

## Límites

- No dupliques reglas canónicas.
- No pongas lógica de negocio en skills compartidas.
- No marques adopción sin evidencia.
- No uses ramas móviles como versión.
- No mantengas OpenSpec archivado como delta activo.

## Respuesta

Resume primero drift, impacto y corrección.

Usa frases cortas.

Incluye enlaces, estados y evidencia faltante.


## ✅ Correcto / ❌ Incorrecto: manejo de existente

- ✅ **Correcto:** Mantener invariantes en el agregado cuando existan; nombre semántico y ports desacoplados de framework/ORM.
- ❌ **Incorrecto:** DDD ceremonial para CRUD trivial, lógica de dominio en controller, repositorio retornando mensajes HTTP del negocio sin necesidad.
- **Gate:** no reescribir masivamente código heredado; inspeccionar baseline, tests y locks reales; reportar `NOT_RUN` si falta evidencia. La guía de refactor se consulta en `vigilio-docs/standards/engineering/refactoring-existing-code.md` según la revisión de Docs aprobada (no asumir que el link remoto `main` ya esté publicado).

</skill-content>

