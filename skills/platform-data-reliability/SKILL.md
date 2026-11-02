---
name: platform-data-reliability
description: Administra confiabilidad de datos 3-2-1, PostgreSQL HA (pgBackRest en VPS Compose o CloudNativePG con WAL separado y Barman Cloud CNPG-I en Kubernetes), Valkey y drills automatizados de restauración física PITR.
owner: governance-platform
lifecycle: experimental
introduced_in: 0.8.0
routing_ecosystems: "cross-stack"
routing_keywords: "backup, backups, restore, restoration, pitr, wal, cloudnativepg, cnpg, postgresql, postgres, valkey, redis, statefulset, rpo, rto, disaster-recovery, data-reliability, barman"
routing_files: "postgres*.yaml, valkey*.yaml, cnpg*.yaml, backup*.yaml, values*.yaml, kustomization.yaml, *barman*.yaml"
routing_capabilities: "data-reliability, storage-reliability, backup-pitr"
requires: []
optional: []
conflicts: []
supersedes: []
---

<skill-content>

# Confiabilidad De Datos, Backups 3-2-1 Y PITR Demostrado

## Lectura obligatoria de referencias

Lee completamente [references/canonical-contract.md](references/canonical-contract.md).

Abre cada fuente canónica aplicable.

No cierres gates cuando una fuente requerida resulte inaccesible.

## Flujo

1. **Regla 3-2-1 y Dominios de Fallo Independientes:** Ni los volúmenes de Compose ni las réplicas síncronas sustituyen un backup. Almacena base backups y archivo continuo de WAL cifrados en un repositorio S3-compatible ubicado en un **host, cuenta o sitio independiente** del almacenamiento productivo.
2. **PostgreSQL según nivel de plataforma:**
   - **Nivel 1 (`compose-vps`):** Configura `pgBackRest` (full semanal, diferencial diario, incremental + WAL continuo para PITR) en lugar de depender únicamente de `pg_dump`.
   - **Niveles 2 y 3 (Kubernetes / Cloud):** Opera `CloudNativePG` en 3 instancias con durabilidad síncrona, **volumen PVC de WAL separado de `PGDATA`**, `Barman Cloud CNPG-I` y directiva GitOps `Prune=false` (o Aurora/RDS Multi-AZ con PITR y `deletion_protection = true`).
3. **Almacenamiento y Estado Secundario:** Configura `StorageClass` cifrada con `reclaimPolicy: Retain` (`replicaCount >= 3` en Longhorn/Rook-Ceph), Valkey como caché reconstruible (AOF + réplicas solo si el SLO lo exige) y copias versionadas de blobs de usuario.
4. **Restore Drill Automatizado (Evidencia Obligatoria):** Un backup está incompleto hasta pasar un **drill periódico de restauración lógica y física PITR** en una instancia aislada sin salida a integraciones reales, midiendo RPO, RTO e invariantes de negocio y purgando los recursos temporales al terminar.

## Qué Hacer Y Qué NO Hacer (Límites Senior)

- ✅ **Hacer:** Separar datos de `development`, `staging` y `production` por completo y exigir `Prune=false` sobre clústeres de base de datos gestionados por Argo CD.
- ❌ **No hacer:** Usar `emptyDir`/`hostPath` o `reclaimPolicy: Delete` en producción, guardar los backups en el mismo clúster RustFS/disco que aloja los datos primarios o restaurar datos reales en `staging` sin anonimización aprobada.
- ❌ **No hacer:** Confiar solo en `pg_dump` cuando el RPO exigido requiere replay continuo de WAL (PITR).

## Respuesta

Resume primero salud, riesgo y acción.

Usa frases cortas.

Incluye evidencia, costos, pruebas y ejemplos aplicables.

## ✅ Correcto / ❌ Incorrecto: manejo de existente

- ✅ **Correcto:** Ejecutar archivado continuo de WAL (`pgBackRest` o `Barman Cloud CNPG-I` con WAL separado), proteger volúmenes con `Retain` / `Prune=false` y demostrar recuperación mediante drills PITR aislados.
- ❌ **Incorrecto:** Asumir que un volumen persistente local o un backup nunca restaurado garantiza recuperación ante pérdida del servidor, error humano o ransomware.
- **Gate:** no reescribir masivamente código heredado; inspeccionar baseline, tests y locks reales; reportar `NOT_RUN` si falta evidencia. La guía de refactor se consulta en `vigilio-docs/standards/engineering/refactoring-existing-code.md` según la revisión de Docs aprobada (no asumir que el link remoto `main` ya esté publicado).

</skill-content>

## Guías de librerías por versión — lectura antes de usar sus APIs

Las versiones de esta skill no se copian aquí: comprobar lockfile y [versión canónica](../.vigilio-docs/technology/versions.md). Cuando la tarea utilice una de estas dependencias, **abrir el `.md` completo** y consultar su migración ✅/❌ antes de escribir código; el resto no es obligatorio para una tarea que no la utiliza.

✅ Correcto: versionar el consumidor y seguir los ejemplos de la API instalada; enlazar documento propietario.  ❌ Incorrecto: copiar APIs legacy, duplicar normas en la skill o instalar nuevas dependencias sin gate.
