---
name: node-nest-security-aws
description: Implementa y revisa seguridad runtime y AWS en backends Node/Nest Vigilio: private-by-default, JWT/AuthZ, Zod env, Secrets Manager/SSM, RDS, S3, Bedrock, Pino, IAM, CDK, Lambda Web Adapter, stages y deploy seguro. Usar al tocar auth, permisos, secretos, configuracion, AWS SDK, uploads, IA, observabilidad, CDK o GitHub Actions.
owner: backend-platform
lifecycle: stable
introduced_in: 0.7.0
routing_ecosystems: "node, nestjs, typescript"
routing_keywords: "jwt, oauth, guard, security, hardening, aws"
routing_files: "package.json, tsconfig.json"
routing_capabilities: "security, auth"
requires: [node-nest-technologies]
optional: []
conflicts: []
supersedes: []
---

<skill-content>

# Seguridad Y AWS En Node/Nest

> Fuente única para **Navegación canónica multistack 2026**: [abrir documento canónico](../.vigilio-docs/stacks/backend/nestjs/README.md).


## Lectura obligatoria de referencias

Antes de actuar, leer de principio a fin cada archivo `references/*` enlazado por esta skill. Dentro
de cada referencia aplicable, abrir y leer completas todas las fuentes canónicas enlazadas; no basta
con leer títulos, tablas o resúmenes. Si una fuente requerida no es accesible, identificarla y no
afirmar cumplimiento ni cerrar el gate que dependa de ella.

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


## ✅ Correcto / ❌ Incorrecto: manejo de existente

- ✅ **Correcto:** AuthN + AuthZ de recurso/tenant; allowlist de salida, secretos fuera de logs y pruebas de acceso cruzado.
- ❌ **Incorrecto:** Permitir rutas públicas por comodidad, confiar sólo en `auth` o construir salida con `$request->all()`.
- **Gate:** no reescribir masivamente código heredado; inspeccionar baseline, tests y locks reales; reportar `NOT_RUN` si falta evidencia. La guía de refactor se consulta en `vigilio-docs/standards/engineering/refactoring-existing-code.md` según la revisión de Docs aprobada (no asumir que el link remoto `main` ya esté publicado).

</skill-content>

## Guías de librerías por versión — lectura antes de usar sus APIs

Las versiones de esta skill no se copian aquí: comprobar lockfile y [versión canónica](../.vigilio-docs/technology/versions.md). Cuando la tarea utilice una de estas dependencias, **abrir el `.md` completo** y consultar su migración ✅/❌ antes de escribir código; el resto no es obligatorio para una tarea que no la utiliza.
- [aws-cdk](../.vigilio-docs/technology/libraries/aws-cdk.md)
- [github-actions](../.vigilio-docs/technology/libraries/github-actions.md)

✅ Correcto: versionar el consumidor y seguir los ejemplos de la API instalada; enlazar documento propietario.  ❌ Incorrecto: copiar APIs legacy, duplicar normas en la skill o instalar nuevas dependencias sin gate.

