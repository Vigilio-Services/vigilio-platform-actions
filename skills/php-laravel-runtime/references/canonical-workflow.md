# Referencias canónicas y gates: php-laravel-runtime

## Fuentes Canónicas

En el ZIP conjunto las guías viven bajo `vigilio-docs/`; para npm independiente utilizar el repo remoto *después de publicar* estos documentos y fijar un commit en la siguiente release de plataforma. Los links remotos a `main` son de navegación, **no una revisión inmutable ni evidencia de publicación**. Nunca afirmar que esas rutas ya existen en GitHub sólo porque están en este ZIP.

- [deployment](../../.vigilio-docs/stacks/backend/laravel/runtime/deployment.md) — `stacks/backend/laravel/runtime/deployment.md`
- [observability](../../.vigilio-docs/stacks/backend/laravel/runtime/observability.md) — `stacks/backend/laravel/runtime/observability.md`
- [deployment-security](../../.vigilio-docs/platform/kubernetes/deployment-security.md) — `platform/kubernetes/deployment-security.md`
- [github-actions-gitops](../../.vigilio-docs/platform/cicd/github-actions-gitops.md) — `platform/cicd/github-actions-gitops.md`
- [otel](../../.vigilio-docs/standards/observability/otel.md) — `standards/observability/otel.md`

Rutas canónicas nuevas (para resolver vía repo):

- ../../.vigilio-docs/stacks/backend/laravel/runtime/deployment.md
- ../../.vigilio-docs/stacks/backend/laravel/runtime/observability.md
- ../../.vigilio-docs/platform/kubernetes/deployment-security.md
- ../../.vigilio-docs/platform/cicd/github-actions-gitops.md
- ../../.vigilio-docs/standards/observability/otel.md

## Pasos verificables

1. Identificar destino real Kubernetes, Lambda u otro antes de aplicar infraestructura; no mezclar perfiles.
2. Construir imagen reproducible con PHP 8.5 patch de seguridad y composer.lock, extensiones verificadas.
3. PHP-FPM/HTTP proxy y workers tienen probes/recursos/graceful termination diferentes; manifests no son copiables sin adapter.
4. Verificar OTel HTTP/DB/Redis/Queue instrumentadas en runtime, logs Monolog sin PII, SLO y dashboard Grafana.
5. Desplegar con revisión GitOps, healthcheck/canary/rollback; nunca afirmar despliegue sin cluster real.

> Fuente única para **Evidencia mínima**: [abrir documento canónico](../../.vigilio-docs/governance/complete-work-coverage-policy.md).


> Fuente única para **Correcto / Incorrecto: manejo de existente**: [abrir documento canónico](../../.vigilio-docs/standards/engineering/refactoring-existing-code.md).

