---
name: terraform-iac-delivery
description: Entrega infraestructura declarativa con Terraform en raíces de estado aisladas (red vs clúster con hash SHA-256 anti-drift y validación anti-solapamiento CIDR), bloqueo nativo use_lockfile, terraform test, Trivy/Checkov, Conftest e Infracost.
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

# Entrega De Infraestructura Como Código Con Terraform

## Lectura obligatoria de referencias

Lee completamente [references/canonical-contract.md](references/canonical-contract.md).

Abre cada fuente canónica aplicable.

No cierres gates cuando una fuente requerida resulte inaccesible.

## Flujo

1. **Raíces de Estado Independientes y Contratos Anti-Drift:** Estratifica `bootstrap/`, `modules/`, `stacks/` y `environments/` separando los estados de red y de clúster/datos por ambiente (`development`, `staging`, `production`); las raíces de clúster consumen el estado remoto de red recalculando su digest `SHA-256` canónico y validan ausencia total de solapamiento CIDR par-a-par.
2. **Bloqueo Concurrente Nativo:** Configura backend remoto con bloqueo activo (`use_lockfile = true` sobre S3 versionado en AWS; Azure Blob Leases en Azure; GCS en GCP; backend HTTP/PostgreSQL bloqueado con token efímero en On-Prem).
3. **Gates Estáticos, Contratos y FinOps en PR:** Ejecuta `terraform fmt -check`, `terraform validate`, `tflint`, contratos nativos `terraform test`, escaneo Trivy IaC / Checkov (`0` hallazgos `HIGH`/`CRITICAL`), políticas Conftest/OPA y diff presupuestario con `Infracost`.
4. **Plan/Apply Serializado con Inventario Protegido:** Aplica cambios únicamente desde CI autenticado por OIDC consumiendo archivos `tfvars` protegidos por entorno, reteniendo el plan exacto y rechazando usar inventarios de ejemplo comiteados para mutar estado real.

## Qué Hacer Y Qué NO Hacer (Límites Senior)

- ✅ **Hacer:** Fijar versión exacta de Terraform y providers (`.terraform.lock.hcl`) y reportar `BLOCKED` cuando falten credenciales o inventario físico autorizado en vez de inventar IPs o simular un `apply`.
- ❌ **No hacer:** Ejecutar `terraform apply` desde terminales locales contra producción, alojar red + EKS + RDS en un solo `tfstate` monolítico, incrustar credenciales estáticas o destruir redes/bases con dependencias activas.

## Respuesta

Resume primero salud, riesgo y acción.

Usa frases cortas.

Incluye evidencia, costos, pruebas y ejemplos aplicables.

## ✅ Correcto / ❌ Incorrecto: manejo de existente

- ✅ **Correcto:** Aislar estados por capa y ambiente con `use_lockfile = true`, validar contratos CIDR/SHA-256 con `terraform test`, auditar seguridad/costo (`Trivy` + `Conftest` + `Infracost`) y aplicar mediante OIDC federado.
- ❌ **Incorrecto:** Mutar infraestructura productiva manualmente, usar inventarios `.example` en `apply` o compartir un único estado sin bloqueo concurrente.
- **Gate:** no reescribir masivamente código heredado; inspeccionar baseline, tests y locks reales; reportar `NOT_RUN` si falta evidencia. La guía de refactor se consulta en `vigilio-docs/standards/engineering/refactoring-existing-code.md` según la revisión de Docs aprobada (no asumir que el link remoto `main` ya esté publicado).

</skill-content>

## Guías de librerías por versión — lectura antes de usar sus APIs

Las versiones de esta skill no se copian aquí: comprobar lockfile y [versión canónica](../.vigilio-docs/technology/versions.md). Cuando la tarea utilice una de estas dependencias, **abrir el `.md` completo** y consultar su migración ✅/❌ antes de escribir código; el resto no es obligatorio para una tarea que no la utiliza.

✅ Correcto: versionar el consumidor y seguir los ejemplos de la API instalada; enlazar documento propietario.  ❌ Incorrecto: copiar APIs legacy, duplicar normas en la skill o instalar nuevas dependencias sin gate.
