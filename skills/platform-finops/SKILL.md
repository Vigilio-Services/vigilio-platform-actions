---
name: platform-finops
description: Implementa inteligencia y optimización FinOps en los 3 niveles (evitar sobreingeniería K8s/NAT en apps simples, gate Infracost en PR, OpenCost, ARM64/Graviton, Spot/Karpenter, TTL en Review Apps, caché y cardinalidad de telemetría).
owner: governance-platform
lifecycle: experimental
introduced_in: 0.8.0
routing_ecosystems: "cross-stack"
routing_keywords: "finops, opencost, graviton, arm64, cost-optimization, spot, kubecost, cost-allocation, cloud-cost"
routing_files: "*.tf, values*.yaml, kustomization.yaml, opencost*.yaml"
routing_capabilities: "finops-intelligence, cost-optimization"
requires: []
optional: []
conflicts: []
supersedes: []
---

<skill-content>

# Inteligencia De Costos Cloud, Optimización Y FinOps

## Lectura obligatoria de referencias

Lee completamente [references/canonical-contract.md](references/canonical-contract.md).

Abre cada fuente canónica aplicable.

No cierres gates cuando una fuente requerida resulte inaccesible.

## Flujo

1. **Elección de arquitectura acorde a escala (Primer ahorro FinOps):** Mantén productos simples a medianos en Nivel 1 (`compose-vps` sobre 1–3 VPS) evitando el impuesto fijo de control planes gestionados, NAT Gateways y balanceadores ociosos hasta que un ADR lo justifique.
2. **Shift-Left FinOps en IaC (`Infracost`) y Etiquetado:** Bloquea PRs de Terraform sin etiquetas contables (`Owner`, `CostCenter`, `Environment`, `Service`) y audita variaciones de gasto mensual con `Infracost` antes de aplicar cambios.
3. **Visibilidad Real y Optimización de Cómputo:** Despliega `OpenCost` para atribución por namespace/pod/MR, prioriza compilaciones multi-arch hacia `ARM64` (`AWS Graviton`) y consolida capacidad elástica con `Karpenter` e instancias `Spot` únicamente en workers idempotentes tolerantes a interrupción.
4. **Higiene de Red, Caché y Entornos Efímeros:** Enruta acceso a S3/DynamoDB/ECR/Secrets por `VPC Endpoints` (evitando cargos por GB en `NAT Gateway`), reduce lecturas de base/origen con `CloudFront OAC` + `Valkey` cache-aside, y aplica `ResourceQuota`, `LimitRange` y expiración automática por TTL a toda Review App (`deploy-preview`).
5. **FinOps de Observabilidad y Almacenamiento:** Limita la cardinalidad de labels en Prometheus (prohibido IDs únicos), ajusta retención por tier hacia object storage económico y purga artefactos OCI/snapshots no promovidos.

## Qué Hacer Y Qué NO Hacer (Límites Senior)

- ✅ **Hacer:** Reconciliar estimaciones de `OpenCost` / `Infracost` contra facturación real o amortización de hardware antes de declarar ahorro certificado.
- ❌ **No hacer:** Provisionar recursos sin etiquetas contables, dejar Review Apps huérfanas sin job de expiración TTL, enrutar tráfico masivo a S3 vía NAT Gateway o inflar facturas de métricas con labels `user_id`/`order_id`.
- ❌ **No hacer:** Poner bases de datos primarias o quórum de control plane sobre nodos `Spot` sacrificando el SLO por ahorro aparente.

## Respuesta

Resume primero salud, riesgo y acción.

Usa frases cortas.

Incluye evidencia, costos, pruebas y ejemplos aplicables.

## ✅ Correcto / ❌ Incorrecto: manejo de existente

- ✅ **Correcto:** Dimensionar la plataforma según el nivel real de carga (VPS Compose vs. K8s), auditar PRs con `Infracost`, medir pods con `OpenCost`, usar Graviton/VPC Endpoints y expirar previews automáticamente.
- ❌ **Incorrecto:** Sobredimensionar clústeres Kubernetes para cargas pequeñas, operar sin alertas de anomalías financieras o presentar una estimación local como costo reconciliado de producción.
- **Gate:** no reescribir masivamente código heredado; inspeccionar baseline, tests y locks reales; reportar `NOT_RUN` si falta evidencia. La guía de refactor se consulta en `vigilio-docs/standards/engineering/refactoring-existing-code.md` según la revisión de Docs aprobada (no asumir que el link remoto `main` ya esté publicado).

</skill-content>

## Guías de librerías por versión — lectura antes de usar sus APIs

Las versiones de esta skill no se copian aquí: comprobar lockfile y [versión canónica](../.vigilio-docs/technology/versions.md). Cuando la tarea utilice una de estas dependencias, **abrir el `.md` completo** y consultar su migración ✅/❌ antes de escribir código; el resto no es obligatorio para una tarea que no la utiliza.

✅ Correcto: versionar el consumidor y seguir los ejemplos de la API instalada; enlazar documento propietario.  ❌ Incorrecto: copiar APIs legacy, duplicar normas en la skill o instalar nuevas dependencias sin gate.
