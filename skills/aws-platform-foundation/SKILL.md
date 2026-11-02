---
name: aws-platform-foundation
description: Diseña la fundación enterprise en AWS (Nivel 3): Organizations multicuenta, VPC 3 AZs + PrivateLink, CloudFront OAC + WAF con S3 privado, Cognito/Entra PKCE, Pod Identity/IRSA, Outbox->SNS->SQS+DLQ, KMS CMK, Security Hub CSPM y Floci local.
owner: governance-platform
lifecycle: experimental
introduced_in: 0.8.0
routing_ecosystems: "cross-stack"
routing_keywords: "aws, vpc, iam, oidc, irsa, kms, eks, privatelink, cloud-foundation, aws-foundation"
routing_files: "*.tf, *.tfvars, provider.tf, backend.tf"
routing_capabilities: "cloud-architecture, aws-foundation"
requires: []
optional: []
conflicts: []
supersedes: []
---

<skill-content>

# Fundación De Plataforma Cloud Enterprise En AWS (Nivel 3)

## Lectura obligatoria de referencias

Lee completamente [references/canonical-contract.md](references/canonical-contract.md).

Abre cada fuente canónica aplicable.

No cierres gates cuando una fuente requerida resulte inaccesible.

## Flujo

1. **Topología Multicuenta y VPC 3 AZs:** Estructura `AWS Organizations` (`Security OU`, `Core OU`, `Workloads OU` con cuentas separadas `dev`/`staging`/`prod`); segmenta cada VPC en 3 AZs (subredes públicas solo ALB/NAT, privadas EKS, aisladas Aurora/RDS + Valkey Serverless exclusivamente vía `VPC Endpoints` PrivateLink).
2. **Identidad Zero-Trust y Borde Protegido:** Usa OIDC federado en CI y `EKS Pod Identity / IRSA` diferenciado por proceso (`api`, `outbox`, `worker`) con cero IAM access keys estáticas; autentica clientes con `Cognito / Entra OIDC + PKCE` (tokens solo en memoria) y sirve tráfico por `CloudFront + OAC + WAF + ACM TLS moderno` manteniendo uploads originales en S3 privado y publicando únicamente derivados sanitizados (`WebP`).
3. **Datos y Mensajería Resiliente:** Confirma negocio + evento `outbox` en la misma transacción PostgreSQL (`FOR UPDATE SKIP LOCKED`), publica a `SNS -> SQS + DLQ` (y `Step Functions + DynamoDB ledger` para sagas) procesando con idempotencia en `processed_events`; cifra todo en reposo con `KMS CMK` y rotación anual.
4. **Postura Continua y Emulación Local Ligera:** Activa `CloudTrail` multi-región validado, `AWS Config`, `Security Hub CSPM`, `Inspector` y `Macie` enrutando hallazgos `HIGH`/`CRITICAL` por `EventBridge`, instrumenta `ADOT / X-Ray` y valida integraciones S3/SNS/SQS localmente con **Floci** (sin claves AWS reales).

## Qué Hacer Y Qué NO Hacer (Límites Senior)

- ✅ **Hacer:** Mantener un único plano IaC en Terraform (con `Infracost`, Trivy IaC y Conftest) y conservar los schemas Zod 4/DTOs dentro de cada módulo de dominio (cero carpeta `contracts/` manual).
- ❌ **No hacer:** Desplegar RDS/Aurora con `publicly_accessible = true`, crear IAM access keys estáticas, exponer buckets de archivos originales sin procesar, mezclar stacks CDK paralelos no gobernados o reportar `terraform plan/apply` no autenticado como `PASS` (debe ser `BLOCKED` / `NOT_RUN`).

## Respuesta

Resume primero salud, riesgo y acción.

Usa frases cortas.

Incluye evidencia, costos, pruebas y ejemplos aplicables.

## ✅ Correcto / ❌ Incorrecto: manejo de existente

- ✅ **Correcto:** Operar cuentas aisladas, subredes de datos con PrivateLink, Pod Identity/IRSA mínimo por proceso, CloudFront OAC + WAF, `Outbox -> SNS -> SQS + DLQ` y cifrado KMS CMK auditado.
- ❌ **Incorrecto:** Exponer bases o buckets crudos a Internet, usar claves IAM estáticas o declarar producción lista sin probar redrive de `DLQ`, rollback y restore drill PITR.
- **Gate:** no reescribir masivamente código heredado; inspeccionar baseline, tests y locks reales; reportar `NOT_RUN` si falta evidencia. La guía de refactor se consulta en `vigilio-docs/standards/engineering/refactoring-existing-code.md` según la revisión de Docs aprobada (no asumir que el link remoto `main` ya esté publicado).

</skill-content>

## Guías de librerías por versión — lectura antes de usar sus APIs

Las versiones de esta skill no se copian aquí: comprobar lockfile y [versión canónica](../.vigilio-docs/technology/versions.md). Cuando la tarea utilice una de estas dependencias, **abrir el `.md` completo** y consultar su migración ✅/❌ antes de escribir código; el resto no es obligatorio para una tarea que no la utiliza.

✅ Correcto: versionar el consumidor y seguir los ejemplos de la API instalada; enlazar documento propietario.  ❌ Incorrecto: copiar APIs legacy, duplicar normas en la skill o instalar nuevas dependencias sin gate.
