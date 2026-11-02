---
name: platform-scalability-capacity
description: Optimiza capacidad y escalabilidad progresiva (EXPLAIN ANALYZE, PgBouncer, Outbox SKIP LOCKED, workers idempotentes) y configura autoscaling en Kubernetes con exclusión mutua HPA vs KEDA, PDB, topologySpreadConstraints y Karpenter.
owner: governance-platform
lifecycle: experimental
introduced_in: 0.8.0
routing_ecosystems: "cross-stack"
routing_keywords: "scalability, escalabilidad, keda, hpa, karpenter, pdb, poddisruptionbudget, poddisruptionbudgets, topology-spread, topologyspread, topologyspreadconstraints, autoscaling, capacity, dimensionamiento, requests, limits, horizontalpodautoscaler, scaledobject"
routing_files: "values*.yaml, kustomization.yaml, hpa*.yaml, scaledobject*.yaml, pdb*.yaml, topology*.yaml, keda*.yaml"
routing_capabilities: "capacity-planning, autoscaling-optimization"
requires: []
optional: []
conflicts: []
supersedes: []
---

<skill-content>

# Optimización De Rendimiento, Escalabilidad Y Capacidad

## Lectura obligatoria de referencias

Lee completamente [references/canonical-contract.md](references/canonical-contract.md).

Abre cada fuente canónica aplicable.

No cierres gates cuando una fuente requerida resulte inaccesible.

## Flujo

1. **Optimizar antes de replicar o partir servicios:** Audita planes SQL con `EXPLAIN (ANALYZE, BUFFERS)`, índices, autovacuum, paginación por cursor y tamaño de transacciones; introduce `PgBouncer` cuando el cuello de botella sean las conexiones PostgreSQL y usa `Valkey` cache-aside con degradación elegante si cae el caché.
2. **Concurrencia segura por diseño:** Escala publicadores `outbox` horizontalmente con `FOR UPDATE SKIP LOCKED` y garantiza procesadores `worker` idempotentes mediante tabla `processed_events` + `DLQ`.
3. **Exclusión mutua HPA vs. KEDA en Kubernetes:** Escala servicios HTTP stateless (`api`, `web`) con **HPA** (CPU/latencia) y consumidores asíncronos (`worker`) con **KEDA** leyendo el backlog real de NATS JetStream / SQS / Valkey. **Jamás combines HPA y KEDA sobre el mismo workload.**
4. **Resiliencia de capacidad y nodos:** Calibra `requests` y `limits` mediante pruebas de carga reales, protege mantenimientos con `PodDisruptionBudget` (`PDB`), dispersa réplicas entre dominios de fallo con `topologySpreadConstraints` y consolida nodos elásticos con `Karpenter`.

## Qué Hacer Y Qué NO Hacer (Límites Senior)

- ✅ **Hacer:** Separar API, Outbox y Worker como procesos independientes ejecutados desde la misma imagen OCI inmutable para escalarlos a ritmos distintos.
- ❌ **No hacer:** Controlar un mismo Deployment con HPA y KEDA a la vez (provoca *thrashing*), escalar workers de cola únicamente por CPU, omitir `limits` de memoria exponiéndose a `OOMKill` ruidoso o extraer microservicios prematuramente sin medir contención real.
- ❌ **No hacer:** Asumir que tres contenedores sobre el mismo host o disco brindan tolerancia a fallos de nodo.

## Respuesta

Resume primero salud, riesgo y acción.

Usa frases cortas.

Incluye evidencia, costos, pruebas y ejemplos aplicables.

## ✅ Correcto / ❌ Incorrecto: manejo de existente

- ✅ **Correcto:** Optimizar consultas y presupuesto de conexiones (`PgBouncer`), aplicar exclusión mutua HPA (HTTP) vs. KEDA (colas) y proteger disponibilidad multizona con `PDB` y `topologySpreadConstraints`.
- ❌ **Incorrecto:** Mezclar HPA + KEDA en el mismo workload, desplegar sin `requests`/`limits` calibrados o escalar a ciegas sin pruebas de carga reproducibles.
- **Gate:** no reescribir masivamente código heredado; inspeccionar baseline, tests y locks reales; reportar `NOT_RUN` si falta evidencia. La guía de refactor se consulta en `vigilio-docs/standards/engineering/refactoring-existing-code.md` según la revisión de Docs aprobada (no asumir que el link remoto `main` ya esté publicado).

</skill-content>

## Guías de librerías por versión — lectura antes de usar sus APIs

Las versiones de esta skill no se copian aquí: comprobar lockfile y [versión canónica](../.vigilio-docs/technology/versions.md). Cuando la tarea utilice una de estas dependencias, **abrir el `.md` completo** y consultar su migración ✅/❌ antes de escribir código; el resto no es obligatorio para una tarea que no la utiliza.

✅ Correcto: versionar el consumidor y seguir los ejemplos de la API instalada; enlazar documento propietario.  ❌ Incorrecto: copiar APIs legacy, duplicar normas en la skill o instalar nuevas dependencias sin gate.
