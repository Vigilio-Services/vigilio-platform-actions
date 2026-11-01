# Referencias canónicas y gates: php-laravel-security

## Fuentes Canónicas

En el ZIP conjunto las guías viven bajo `vigilio-docs/`; para npm independiente utilizar el repo remoto *después de publicar* estos documentos y fijar un commit en la siguiente release de plataforma. Los links remotos a `main` son de navegación, **no una revisión inmutable ni evidencia de publicación**. Nunca afirmar que esas rutas ya existen en GitHub sólo porque están en este ZIP.

- [authorization](../../.vigilio-docs/standards/security/authorization.md) — `standards/security/authorization.md`
- [sanctum-policies](../../.vigilio-docs/stacks/backend/laravel/security/sanctum-policies.md) — `stacks/backend/laravel/security/sanctum-policies.md`
- [controllers](../../.vigilio-docs/stacks/backend/laravel/http/controllers.md) — `stacks/backend/laravel/http/controllers.md`
- [errors](../../.vigilio-docs/stacks/backend/laravel/http/errors.md) — `stacks/backend/laravel/http/errors.md`

Rutas canónicas nuevas (para resolver vía repo):

- ../../.vigilio-docs/standards/security/authorization.md
- ../../.vigilio-docs/stacks/backend/laravel/security/sanctum-policies.md
- ../../.vigilio-docs/stacks/backend/laravel/http/controllers.md
- ../../.vigilio-docs/stacks/backend/laravel/http/errors.md

## Pasos verificables

1. Backend privado por defecto; identificar auth cookie/token/SSO; Sanctum sólo si corresponde.
2. Asegurar FormRequest authorize, Gate Policy por recurso y repository tenant-scoped sin exponer existencia de terceros.
3. Configurar rate limiting, csrf según auth, mínimos permisos, gestión de secrets y error response no informativo.
4. Pruebas anónimo, sin permiso, otro tenant, IDOR, expiración y session/tokens; logs y cache sin PII.

> Fuente única para **Evidencia mínima**: [abrir documento canónico](../../.vigilio-docs/governance/complete-work-coverage-policy.md).


> Fuente única para **Correcto / Incorrecto: manejo de existente**: [abrir documento canónico](../../.vigilio-docs/standards/engineering/refactoring-existing-code.md).

