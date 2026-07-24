# Checklist Seguridad Y Cloud Node/Nest

## Fuentes Del Repositorio

- [Ambientes](https://github.com/VigilioYonatan/vigilio-docs/blob/main/backend-node-nest/3-ambientes-trabajo.md): stages y promotion.
- [DevSecOps](https://github.com/VigilioYonatan/vigilio-docs/blob/main/backend-node-nest/4-devsecops.md): gates y supply chain.
- [Logging](https://github.com/VigilioYonatan/vigilio-docs/blob/main/backend-node-nest/11-logging-pino.md): logging y redaction.
- [Autorizacion](https://github.com/VigilioYonatan/vigilio-docs/blob/main/backend-node-nest/12-authz-security.md): private-by-default y policies.
- [Hardening](https://github.com/VigilioYonatan/vigilio-docs/blob/main/backend-node-nest/23-seguridad-hardening.md): Definition of Done.
- [Configuracion](https://github.com/VigilioYonatan/vigilio-docs/blob/main/backend-node-nest/29-config-nest-zod-aws.md): configuracion runtime.
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
