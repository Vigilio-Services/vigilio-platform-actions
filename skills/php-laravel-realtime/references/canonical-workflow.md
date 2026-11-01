# Referencias canónicas y gates: php-laravel-realtime

## Fuentes Canónicas

En el ZIP conjunto las guías viven bajo `vigilio-docs/`; para npm independiente utilizar el repo remoto *después de publicar* estos documentos y fijar un commit en la siguiente release de plataforma. Los links remotos a `main` son de navegación, **no una revisión inmutable ni evidencia de publicación**. Nunca afirmar que esas rutas ya existen en GitHub sólo porque están en este ZIP.

- [sanctum-policies](../../.vigilio-docs/stacks/backend/laravel/security/sanctum-policies.md) — `stacks/backend/laravel/security/sanctum-policies.md`
- [deployment-security](../../.vigilio-docs/platform/kubernetes/deployment-security.md) — `platform/kubernetes/deployment-security.md`
- [observability](../../.vigilio-docs/stacks/backend/laravel/runtime/observability.md) — `stacks/backend/laravel/runtime/observability.md`

Rutas canónicas nuevas (para resolver vía repo):

- ../../.vigilio-docs/stacks/backend/laravel/security/sanctum-policies.md
- ../../.vigilio-docs/platform/kubernetes/deployment-security.md
- ../../.vigilio-docs/stacks/backend/laravel/runtime/observability.md

## Pasos verificables

1. Confirmar necesidad real de realtime: WebSocket vs SSE/polling, no instalar Reverb por defecto.
2. Configurar auth de canales privados por tenant, límites rate/size, backpressure y conexiones.
3. Reverb1.x opcional, supervisión de workers, balanceo y métricas de conexiones.
4. Pruebas autorización de canales, reconexión, fallos de red y despliegue compatible.

> Fuente única para **Evidencia mínima**: [abrir documento canónico](../../.vigilio-docs/governance/complete-work-coverage-policy.md).


> Fuente única para **Correcto / Incorrecto: manejo de existente**: [abrir documento canónico](../../.vigilio-docs/standards/engineering/refactoring-existing-code.md).

