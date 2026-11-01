# Checklist de seguridad transversal NestJS

- [Autorización y secretos](../../.vigilio-docs/standards/security/authorization.md) — verificar el nombre real del documento en el snapshot.
- [Ejemplo canónico NestJS](../../.vigilio-docs/stacks/backend/nestjs/http/references/6-ejemplos-codigo.md)
- [DDD compartido](../../.vigilio-docs/foundations/architecture/ddd.md)

1. Prueba 401 usuario anónimo, 403 usuario sin permiso, 403/404 para objeto ajeno.
2. Guard/AuthN y policy/AuthZ son capas distintas; documentar `@ApiBearerAuth` no reemplaza ejecutar guards.
3. Filtros de tenant en SELECT y COUNT; no confiar en `tenant_id` del query público.
4. Proyección allowlist, traceId sin tokens, excepciones sin detalles SQL.
5. Probar JWT revocado/expirado, endpoints públicos explícitos y fallback fail-closed.

> Fuente única para **Navegación canónica multistack 2026**: [abrir documento canónico](../../.vigilio-docs/stacks/backend/nestjs/README.md).


