---
name: platform-scalability-capacity
description: Configura escalabilidad elástica en Kubernetes con KEDA, HPA, aprovisionamiento con Karpenter y límites PDB.
owner: governance-platform
lifecycle: experimental
introduced_in: 0.8.0
routing_ecosystems: "cross-stack"
routing_keywords: "scalability, keda, hpa, karpenter, pdb, topology-spread, autoscaling, kind: HorizontalPodAutoscaler, kind: ScaledObject"
routing_files: "values*.yaml, kustomization.yaml, hpa*.yaml, scaledobject*.yaml"
routing_capabilities: "capacity-planning, autoscaling-optimization"
requires: []
optional: []
conflicts: []
supersedes: []
---

<skill-content>

# Escalabilidad Y Capacidad En Kubernetes

## Lectura obligatoria de referencias

Lee completamente [references/canonical-contract.md](references/canonical-contract.md).

Abre cada fuente canónica aplicable.

No cierres gates cuando una fuente requerida resulte inaccesible.

## Flujo

1. Configura KEDA para escalar procesadores asíncronos según profundidad de colas SQS/Valkey.
2. Establece HPA basado en métricas de latencia y uso de CPU para servicios HTTP.
3. Aprovisiona nodos eficientes just-in-time en AWS EKS mediante Karpenter.
4. Configura Topology Spread Constraints para dispersión multizona equilibrada.
5. Define PodDisruptionBudgets (PDB) para proteger la disponibilidad durante mantenimientos.

## Límites

- No desplegar servicios sin requests y limits de memoria calibrados.
- No escalar procesadores asíncronos basándose exclusivamente en métricas de CPU.
- No permitir que la indisponibilidad de una sola zona afecte el servicio.

## Respuesta

Resume primero salud, riesgo y acción.

Usa frases cortas.

Incluye evidencia, costos, pruebas y ejemplos aplicables.

## ✅ Correcto / ❌ Incorrecto: manejo de existente

- ✅ **Correcto:** Dimensionar requests/limits reales, escalar colas con KEDA y proteger disponibilidad con PDBs y Karpenter.
- ❌ **Incorrecto:** Omitir límites de recursos provocando disputas descontroladas de CPU o escalado tardío de workers.
- **Gate:** no reescribir masivamente código heredado; inspeccionar baseline, tests y locks reales; reportar `NOT_RUN` si falta evidencia. La guía de refactor se consulta en `vigilio-docs/standards/engineering/refactoring-existing-code.md` según la revisión de Docs aprobada (no asumir que el link remoto `main` ya esté publicado).

</skill-content>

## Guías de librerías por versión — lectura antes de usar sus APIs

Las versiones de esta skill no se copian aquí: comprobar lockfile y [versión canónica](../.vigilio-docs/technology/versions.md). Cuando la tarea utilice una de estas dependencias, **abrir el `.md` completo** y consultar su migración ✅/❌ antes de escribir código; el resto no es obligatorio para una tarea que no la utiliza.

✅ Correcto: versionar el consumidor y seguir los ejemplos de la API instalada; enlazar documento propietario.  ❌ Incorrecto: copiar APIs legacy, duplicar normas en la skill o instalar nuevas dependencias sin gate.