---
name: node-nest-security
description: Aplica autenticación, autorización, secretos, validación de entrada y protección de datos a NestJS sin asumir Lambda ni EKS.
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

# Node Nest Security (independiente del runtime)

> Fuente única para **Navegación canónica multistack 2026**: [abrir documento canónico](../.vigilio-docs/stacks/backend/nestjs/README.md).


## Activar para

Guards, Policies, JWT/SSO, Zod en requests, permisos por recurso/tenant, credenciales, logging y redacción. No modifica destino de despliegue.

## Procedimiento

1. Leer `references/security-checklist.md`, AGENTS.md, perfiles del consumidor y el snapshot local `.vigilio-docs` instalado por npm.
2. Confirmar `JwtAuthGuard` u otro guard real y verificar **privado por defecto**; `@ApiBearerAuth()` sólo documenta, no autoriza.
3. Añadir autorización por recurso, pertenencia al tenant y rate limit según contrato; negar por defecto, con tests cruzados.
4. Validar input Zod en borde HTTP, DTO público desde `productSchema.pick()` y `z.infer`. No `.parse()` de respuesta por mero tipado.
5. No registrar PII/secrets; logs con traceId, redacción y métricas de cardinalidad baja.
6. Ejecutar unit/feature/e2e y OpenAPI diff; `NOT_RUN` si falta evidencia.

## Antipatrones

- ✅ Policy de recurso/tenant y puertos; ❌ confundir JWT válido con permiso del actor.
- ✅ Acceso cloud por identidad de workload; ❌ access key estática.
- ✅ Perfil EKS o Lambda elegido aparte; ❌ importar instrucciones CDK para un backend EKS sin ADR.

## Guías de librerías por versión — lectura antes de usar sus APIs

Las versiones de esta skill no se copian aquí: comprobar lockfile y [versión canónica](../.vigilio-docs/technology/versions.md). Cuando la tarea utilice una de estas dependencias, **abrir el `.md` completo** y consultar su migración ✅/❌ antes de escribir código; el resto no es obligatorio para una tarea que no la utiliza.
- [nestjs](../.vigilio-docs/technology/libraries/nestjs.md)
- [zod](../.vigilio-docs/technology/libraries/zod.md)

✅ Correcto: versionar el consumidor y seguir los ejemplos de la API instalada; enlazar documento propietario.  ❌ Incorrecto: copiar APIs legacy, duplicar normas en la skill o instalar nuevas dependencias sin gate.


## Librerías propietarias adicionales — lectura por tarea

Estas referencias no duplican normativa: consultar la API, migración y versión instalada **solo cuando la tarea utilice la librería**.

- [docker-buildx](../.vigilio-docs/technology/libraries/docker-buildx.md)


## Lectura obligatoria de referencias

Consultar las referencias locales del módulo antes de ejecutar modificaciones normativas.

