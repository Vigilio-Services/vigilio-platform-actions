---
name: architecture-traceability
description: Mantiene trazabilidad entre documentación canónica, implementación, OpenSpec, skills, versiones, propietarios y evidencia. Usar al introducir capacidades, publicar tooling, archivar cambios o revisar drift entre repositorios.
---

<skill-content>

# Trazabilidad Arquitectónica

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

</skill-content>
