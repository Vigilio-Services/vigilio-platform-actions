---
name: platform-data-reliability
description: Administra cargas con estado y operadores de bases de datos CloudNativePG y Valkey con replicación y PITR en Kubernetes.
owner: governance-platform
lifecycle: experimental
introduced_in: 0.8.0
routing_ecosystems: "cross-stack"
routing_keywords: "data-reliability, postgresql, cloudnativepg, valkey, redis, statefulset, csi"
routing_files: "values.yaml, kustomization.yaml, Cluster, postgresql.yaml"
routing_capabilities: "data-engineering, storage-reliability"
requires: []
optional: []
conflicts: []
supersedes: []
---

<skill-content>

# Confiabilidad De Datos En Kubernetes

## Lectura obligatoria de referencias

Lee completamente [references/canonical-contract.md](references/canonical-contract.md).

Abre cada fuente canónica aplicable.

No cierres gates cuando una fuente requerida resulte inaccesible.

## Flujo

1. Despliega clústeres PostgreSQL de alta disponibilidad mediante el operador CloudNativePG.
2. Configura archivado continuo de transacciones WAL hacia buckets S3 para PITR.
3. Despliega instancias Valkey con réplicas y persistencia AOF periódica.
4. Define StorageClasses con cifrado obligatorio y reclaimPolicy: Retain en producción.
5. Valida conmutación por error (failover) automática y pruebas de restauración.

## Límites

- No usar carpetas efímeras (emptyDir) para bases de datos con datos persistentes.
- No configurar reclaimPolicy: Delete en volúmenes de producción.
- No omitir el archivado continuo de WAL hacia almacenamiento externo.

## Respuesta

Resume primero salud, riesgo y acción.

Usa frases cortas.

Incluye evidencia, costos, pruebas y ejemplos aplicables.

## ✅ Correcto / ❌ Incorrecto: manejo de existente

- ✅ **Correcto:** Aprovechar operadores nativos con replicación síncrona, failover automatizado y archivado WAL continuo.
- ❌ **Incorrecto:** Ejecutar pods de base de datos sin operador ni respaldos externos confiando en la persistencia local del nodo.
- **Gate:** no reescribir masivamente código heredado; inspeccionar baseline, tests y locks reales; reportar `NOT_RUN` si falta evidencia. La guía de refactor se consulta en `vigilio-docs/standards/engineering/refactoring-existing-code.md` según la revisión de Docs aprobada (no asumir que el link remoto `main` ya esté publicado).

</skill-content>

## Guías de librerías por versión — lectura antes de usar sus APIs

Las versiones de esta skill no se copian aquí: comprobar lockfile y [versión canónica](../.vigilio-docs/technology/versions.md). Cuando la tarea utilice una de estas dependencias, **abrir el `.md` completo** y consultar su migración ✅/❌ antes de escribir código; el resto no es obligatorio para una tarea que no la utiliza.

✅ Correcto: versionar el consumidor y seguir los ejemplos de la API instalada; enlazar documento propietario.  ❌ Incorrecto: copiar APIs legacy, duplicar normas en la skill o instalar nuevas dependencias sin gate.