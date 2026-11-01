---
name: aws-platform-foundation
description: Diseña la fundación cloud en AWS con topología multicuenta, VPCs de 3 AZs, endpoints privados y federación OIDC/IRSA.
owner: governance-platform
lifecycle: experimental
introduced_in: 0.8.0
routing_ecosystems: "cross-stack"
routing_keywords: "aws, vpc, iam, oidc, irsa, kms, eks, privatelink, cloud"
routing_files: "*.tf, *.tfvars, provider.tf, backend.tf"
routing_capabilities: "cloud-architecture, aws-foundation"
requires: []
optional: []
conflicts: []
supersedes: []
---

<skill-content>

# Fundación De Plataforma Cloud En AWS

## Lectura obligatoria de referencias

Lee completamente [references/canonical-contract.md](references/canonical-contract.md).

Abre cada fuente canónica aplicable.

No cierres gates cuando una fuente requerida resulte inaccesible.

## Flujo

1. Estructura cuentas AWS en Organizations con separación por OUs (Core, Security, Workloads).
2. Diseña VPCs con 3 AZs segmentadas en subredes públicas, privadas y de datos aislados.
3. Configura endpoints de VPC (PrivateLink) para S3, DynamoDB, ECR y Secrets Manager.
4. Implementa federación OIDC para CI/CD y roles Pod Identity/IRSA para cargas EKS.
5. Aplica cifrado KMS en reposo en todos los servicios de almacenamiento.

## Límites

- No exponer bases de datos o subredes de aplicación a la Internet pública.
- No crear usuarios IAM locales con claves de acceso estáticas.
- No prescindir de auditoría CloudTrail o VPC Flow Logs en cuentas productivas.

## Respuesta

Resume primero salud, riesgo y acción.

Usa frases cortas.

Incluye evidencia, costos, pruebas y ejemplos aplicables.

## ✅ Correcto / ❌ Incorrecto: manejo de existente

- ✅ **Correcto:** Utilizar VPCs privadas multi-AZ, endpoints de VPC privados y roles IAM efímeros federados por OIDC.
- ❌ **Incorrecto:** Desplegar clústeres o bases de datos en subredes públicas o compartir credenciales de superadministrador.
- **Gate:** no reescribir masivamente código heredado; inspeccionar baseline, tests y locks reales; reportar `NOT_RUN` si falta evidencia. La guía de refactor se consulta en `vigilio-docs/standards/engineering/refactoring-existing-code.md` según la revisión de Docs aprobada (no asumir que el link remoto `main` ya esté publicado).

</skill-content>

## Guías de librerías por versión — lectura antes de usar sus APIs

Las versiones de esta skill no se copian aquí: comprobar lockfile y [versión canónica](../.vigilio-docs/technology/versions.md). Cuando la tarea utilice una de estas dependencias, **abrir el `.md` completo** y consultar su migración ✅/❌ antes de escribir código; el resto no es obligatorio para una tarea que no la utiliza.

✅ Correcto: versionar el consumidor y seguir los ejemplos de la API instalada; enlazar documento propietario.  ❌ Incorrecto: copiar APIs legacy, duplicar normas en la skill o instalar nuevas dependencias sin gate.