# Checklist Seguridad Y Cloud Node/Nest

## Fuentes Del Repositorio

- [Ambientes](../../.vigilio-docs/platform/cicd/references/3-ambientes-trabajo.md): stages y promotion.
- [DevSecOps](../../.vigilio-docs/platform/cicd/references/4-devsecops.md): gates y supply chain.
- [Logging](../../.vigilio-docs/stacks/backend/nestjs/runtime/references/11-logging-pino.md): logging y redaction.
- [Autorizacion](../../.vigilio-docs/stacks/backend/nestjs/security/references/12-authz-security.md): private-by-default y policies.
- [Hardening](../../.vigilio-docs/stacks/backend/nestjs/security/references/23-seguridad-hardening.md): Definition of Done.
- [Configuracion](../../.vigilio-docs/stacks/backend/nestjs/runtime/references/29-config-nest-zod-aws.md): configuracion runtime.
- `src/shared/infrastructure/config/`: loader y validacion.
- resolver de conexión DB del consumidor: secreto RDS y TLS.
- `cdk/lib/stacks/`: infraestructura ejecutable.
- `.github/workflows/secure-deploy-cdk.yml`: promotion segura.

## Checklist De Merge

- Endpoint clasificado: public, authenticated, role/policy y tenant.
- Casos 401, 403 y permitido cubiertos cuando aplican.
- Input/output no expone PII o secretos.
- Logs tienen contexto y redaction.
- IAM limita acciones y recursos.
- Secretos no aparecen en codigo, fixtures, artefactos o outputs.
- Calls externas tienen timeout, error normalization y retry solo si idempotente.
- Config falla en boot, no durante el primer request.
- CDK synth y cdk-nag pasan.

## Checklist De Deploy

- Artefacto inmutable corresponde al SHA.
- Manifest y firma KMS verificados.
- GitHub Environment y OIDC usan la cuenta correcta.
- `APP_STAGE`, `NODE_ENV`, URL/secret RDS y app secret son coherentes.
- Migration compatible aplicada antes de codigo que la requiere.
- Smoke valida readiness y endpoints criticos.
- Alarmas y dashboard activos.
- Rollback apunta al ultimo artefacto firmado, no a un rebuild.

## ✅ Correcto / ❌ Incorrecto: manejo de existente

- ✅ **Correcto:** AuthN + AuthZ de recurso/tenant; allowlist de salida, secretos fuera de logs y pruebas de acceso cruzado.
- ❌ **Incorrecto:** Permitir rutas públicas por comodidad, confiar sólo en `auth` o construir salida con `$request->all()`.
- **Gate:** no reescribir masivamente código heredado; inspeccionar baseline, tests y locks reales; reportar `NOT_RUN` si falta evidencia. La guía de refactor se consulta en `vigilio-docs/standards/engineering/refactoring-existing-code.md` según la revisión de Docs aprobada (no asumir que el link remoto `main` ya esté publicado).

> Fuente única para **Navegación canónica multistack 2026**: [abrir documento canónico](../../.vigilio-docs/stacks/backend/nestjs/README.md).


