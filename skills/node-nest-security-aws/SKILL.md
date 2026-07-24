---
name: node-nest-security-aws
description: "Implementa y revisa seguridad runtime y AWS en backends Node/Nest Vigilio: private-by-default, JWT/AuthZ, Zod env, Secrets Manager/SSM, RDS, S3, Bedrock, Pino, IAM, CDK, Lambda Web Adapter, stages y deploy seguro. Usar al tocar auth, permisos, secretos, configuracion, AWS SDK, uploads, IA, observabilidad, CDK o GitHub Actions."
---

<skill-content>

# Seguridad Y AWS En Node/Nest

Priorizar guards, config runtime, CDK sintetizado, workflows y tests sobre afirmaciones documentales. Si una proteccion solo aparece en `docs/`, tratarla como brecha pendiente.

## Runtime Seguro

1. Mantener `JwtAuthGuard` global y rutas privadas por defecto.
2. Usar `@Public()` solo para endpoints anonimos deliberados y probar el bypass.
3. Separar AuthN de AuthZ; roles no sustituyen ownership, tenant o policy.
4. Validar body/query/params con Zod y limitar paginacion/tamano.
5. No retornar hashes, secrets, claims internos ni filas completas.
6. Redactar authorization, cookies, passwords y tokens en Pino.

## Configuracion Y Stages

- `APP_STAGE`: `local`, `development`, `staging`, `production`.
- `NODE_ENV=test` es modo de pruebas, no un stage CDK.
- Cargar cloud config antes de construir `AppModule`.
- Prioridad: variables runtime, app secret, SSM configurado, `.env` solo local.
- Usar `ConfigService` dentro de Nest; limitar `process.env` a bootstrap, scripts y CDK.
- Fuera de local, fallar cerrado si falta DB o secreto obligatorio; nunca caer a localhost.
- Desactivar Swagger/Scalar en production salvo excepcion aprobada.

## AWS

- Usar IAM roles y OIDC; nunca access keys estaticas en cloud.
- Guardar secretos en Secrets Manager y config no sensible en SSM cuando exista ownership.
- Resolver `DATABASE_SECRET_ARN` con TLS y otorgar solo `GetSecretValue` al role de la API.
- Para S3, firmar MIME/tamano/encryption, usar keys opacas, bucket privado y expiracion corta.
- Para Bedrock, limitar tokens/temperature, normalizar errores y evitar prompts sensibles en logs.
- Cerrar clientes SDK cuando el provider sea lifecycle owner.

## CDK Y Deploy

- Mantener stacks separados de network, database, API y observability.
- Centralizar naming, tags y stage config.
- Desplegar el artefacto real de `.artifacts/lambda`; no reintroducir placeholder.
- Mantener Lambda Web Adapter ARM64 fijado por version y `run.sh` LF/0755.
- Ejecutar build, tests, OpenAPI diff, CDK synth, SBOM, firma KMS, diff, deploy y smoke.
- Staging/production requieren smoke; staging agrega DAST. Production requiere approval y rollback target.

## No Hacer

- No registrar secretos o PII.
- No usar `*` IAM salvo limitacion AWS documentada y suprimida con razon concreta.
- No leer `.env.production` ni tolerar defaults inseguros en staging/production.
- No mezclar cuentas, VPC, RDS, KMS o buckets de production con lower environments.
- No usar SDK AWS directamente desde controllers/application cuando corresponde un port/provider.
- No editar workflows reutilizables sin ejecutar governance y revisar permisos.

## Referencias

Leer [references/security-cloud-checklist.md](references/security-cloud-checklist.md) para fuentes y checklist de merge/deploy.

</skill-content>
