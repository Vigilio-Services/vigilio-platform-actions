---
name: terraform-iac-delivery
description: Aprovisiona y entrega infraestructura como código con Terraform estratificado, bloqueo de estado y pruebas de políticas.
owner: governance-platform
lifecycle: experimental
introduced_in: 0.8.0
routing_ecosystems: "cross-stack"
routing_keywords: "terraform, iac, hcl, modules, state-locking, drift, checkov, tflint, use_lockfile, terraform-delivery"
routing_files: "*.tf, *.tfvars, *.hcl, .terraform.lock.hcl"
routing_capabilities: "iac-delivery, terraform-architecture"
requires: []
optional: []
conflicts: []
supersedes: []
---

<skill-content>

# Entrega De IaC Con Terraform

## Lectura obligatoria de referencias

Lee completamente [references/canonical-contract.md](references/canonical-contract.md).

Abre cada fuente canónica aplicable.

No cierres gates cuando una fuente requerida resulte inaccesible.

## Flujo

1. Estratifica Terraform en bootstrap, modules, stacks y environments.
2. Configura backend remoto con bloqueo concurrente (en AWS: S3 versionado con bloqueo nativo use_lockfile = true; DynamoDB solo para migraciones legacy; Azure Blob Leases en Azure; GCS en GCP; PostgreSQL o Consul en On-Prem).
3. Ejecuta terraform fmt, tflint y escaneo de seguridad con Checkov en PR.
4. Genera plan especulativo y audita cambios de recursos.
5. Aplica cambios exclusivamente en merge a main mediante runner CI con identidad federada (OIDC del proveedor cloud correspondiente).

## Límites

- No incluir credenciales estáticas de proveedores cloud en código HCL o variables de CI.
- No declarar providers o backends hardcodeados dentro de módulos reutilizables.
- No ejecutar terraform apply desde terminales locales hacia producción.

## Respuesta

Resume primero salud, riesgo y acción.

Usa frases cortas.

Incluye evidencia, costos, pruebas y ejemplos aplicables.

## ✅ Correcto / ❌ Incorrecto: manejo de existente

- ✅ **Correcto:** Mantener módulos puros reutilizables, backend S3 con use_lockfile = true (o bloqueo nativo del proveedor) y aplicar planes aprobados mediante OIDC federado en CI.
- ❌ **Incorrecto:** Ejecutar terraform apply manual en producción o alojar todo el estado en un archivo monolítico sin bloqueo.
- **Gate:** no reescribir masivamente código heredado; inspeccionar baseline, tests y locks reales; reportar `NOT_RUN` si falta evidencia. La guía de refactor se consulta en `vigilio-docs/standards/engineering/refactoring-existing-code.md` según la revisión de Docs aprobada (no asumir que el link remoto `main` ya esté publicado).

</skill-content>

## Guías de librerías por versión — lectura antes de usar sus APIs

Las versiones de esta skill no se copian aquí: comprobar lockfile y [versión canónica](../.vigilio-docs/technology/versions.md). Cuando la tarea utilice una de estas dependencias, **abrir el `.md` completo** y consultar su migración ✅/❌ antes de escribir código; el resto no es obligatorio para una tarea que no la utiliza.

✅ Correcto: versionar el consumidor y seguir los ejemplos de la API instalada; enlazar documento propietario.  ❌ Incorrecto: copiar APIs legacy, duplicar normas en la skill o instalar nuevas dependencias sin gate.