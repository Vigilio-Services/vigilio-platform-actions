---
name: node-nest-contracts-release
description: Gobierna contratos HTTP Node/Nest con DTOs Zod request/response, adaptadores .doc.ts, paquetes browser-safe, OpenAPI diff, SemVer, Changesets, SBOM, provenance y releases coordinadas con web-mfe. Usar al cambiar schemas, DTOs, responses, controllers, OpenAPI, contratos compartidos, versiones de paquetes o breaking changes.
---

<skill-content>

# Contratos Y Release Node/Nest

Leer las fuentes canónicas y el contrato ejecutable; esta skill no duplica ejemplos de DTOs ni políticas de release.

## Flujo obligatorio

1. Leer [references/canonical-docs.md](references/canonical-docs.md).
2. Confirmar consumidores, endpoint, request/response, compatibilidad y owner del contrato.
3. Mantener `*.request.dto.ts` y `*.response.dto.ts` puros: Zod + tipos; Nest/OpenAPI solo en `*.doc.ts`.
4. Derivar shapes runtime con Zod `.pick/.omit/.partial/.extend` y tipos con `z.infer`; usar
   `Pick/Omit/Partial/Readonly/&` solo para proyecciones type-only sin repetir campos.
5. Exportar y validar OpenAPI desde el código; ejecutar diff contra el baseline versionado.
6. Clasificar el cambio como compatible, deprecación o breaking; no esconder breaking changes con aliases.
7. Coordinar `@vigilioyonatan/bus-contracts`, web-mfe y migraciones antes de publicar.
8. Publicar paquetes con SemVer, Changesets, SBOM, provenance y digest inmutable; consumidores fijan versiones exactas.
9. Probar backend, OpenAPI, paquete browser-safe, bundle frontend y rollback de release.

## Límites

- No importar `nestjs-zod`, `@nestjs/*` o Node built-ins en el paquete browser-safe.
- No inventar DTOs/interfaces espejo ni usar utilities TypeScript como sustituto de validación Zod runtime.
- No usar `latest`, ranges flotantes, `workspace:*` o links fuera del desarrollo local permitido.
- No editar una migración aplicada ni cambiar response sin OpenAPI diff y plan de consumidores.
- No declarar un release publicado si solo existe un cambio local.

</skill-content>
