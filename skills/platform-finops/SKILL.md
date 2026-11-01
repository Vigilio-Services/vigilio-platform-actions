---
name: platform-finops
description: Implementa inteligencia de costos cloud, etiquetado obligatorio, optimización ARM64/Graviton y visibilidad con OpenCost.
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

# Inteligencia De Costos Cloud Y FinOps

## Lectura obligatoria de referencias

Lee completamente [references/canonical-contract.md](references/canonical-contract.md).

Abre cada fuente canónica aplicable.

No cierres gates cuando una fuente requerida resulte inaccesible.

## Flujo

1. Establece etiquetas obligatorias en Terraform y Kubernetes (Owner, CostCenter, Environment).
2. Despliega OpenCost para visibilidad en tiempo real del costo de CPU, memoria y almacenamiento por pod.
3. Optimiza imágenes y compilaciones para arquitecturas ARM64 (AWS Graviton).
4. Aprovecha orquestación Spot y consolidación de nodos con Karpenter.
5. Configura reglas de detección de anomalías de costos y alertas automatizadas.

## Límites

- No provisionar recursos sin etiquetas contables de atribución de costos.
- No mantener instancias sobredimensionadas con baja utilización sostenida.
- No enrutar tráfico interno a través de NAT Gateways generando costos evitables.

## Respuesta

Resume primero salud, riesgo y acción.

Usa frases cortas.

Incluye evidencia, costos, pruebas y ejemplos aplicables.

## ✅ Correcto / ❌ Incorrecto: manejo de existente

- ✅ **Correcto:** Monitorear costos en tiempo real con OpenCost, migrar a Graviton y rechazar recursos no etiquetados.
- ❌ **Incorrecto:** Operar infraestructura cloud sin visibilidad granular de gasto por equipo ni alertas de anomalías financieras.
- **Gate:** no reescribir masivamente código heredado; inspeccionar baseline, tests y locks reales; reportar `NOT_RUN` si falta evidencia. La guía de refactor se consulta en `vigilio-docs/standards/engineering/refactoring-existing-code.md` según la revisión de Docs aprobada (no asumir que el link remoto `main` ya esté publicado).

</skill-content>

## Guías de librerías por versión — lectura antes de usar sus APIs

Las versiones de esta skill no se copian aquí: comprobar lockfile y [versión canónica](../.vigilio-docs/technology/versions.md). Cuando la tarea utilice una de estas dependencias, **abrir el `.md` completo** y consultar su migración ✅/❌ antes de escribir código; el resto no es obligatorio para una tarea que no la utiliza.

✅ Correcto: versionar el consumidor y seguir los ejemplos de la API instalada; enlazar documento propietario.  ❌ Incorrecto: copiar APIs legacy, duplicar normas en la skill o instalar nuevas dependencias sin gate.