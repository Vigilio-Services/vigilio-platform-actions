---
name: platform-resilience-disaster-recovery
description: Diseña continuidad de negocio, objetivos RPO/RTO medidos, respaldos externos 3-2-1 (Velero / pgBackRest / Barman), conmutación entre dominios de fallo reales, redrive de DLQ e ingeniería del caos (Chaos Mesh / GameDays).
owner: governance-platform
lifecycle: experimental
introduced_in: 0.8.0
routing_ecosystems: "cross-stack"
routing_keywords: "disaster-recovery, velero, chaos-mesh, failover, rpo, rto, contingencia, resiliencia, gameday, chaos-engineering, backup-schedule, runbook"
routing_files: "velero*.yaml, chaos*.yaml, dr*.yaml, backup-schedule*.yaml, schedule*.yaml, values*.yaml, kustomization.yaml, *dr*.md, *runbook*.md"
routing_capabilities: "sre-resilience, disaster-recovery"
requires: []
optional: []
conflicts: []
supersedes: []
---

<skill-content>

# Resiliencia, Dominios De Fallo Y Recuperación Ante Desastres (DR)

## Lectura obligatoria de referencias

Lee completamente [references/canonical-contract.md](references/canonical-contract.md).

Abre cada fuente canónica aplicable.

No cierres gates cuando una fuente requerida resulte inaccesible.

## Flujo

1. **Matriz RPO/RTO por activo:** Acuerda con negocio RPO y RTO explícitos para PostgreSQL, blobs/uploads, backlog de mensajería (replay desde `outbox`), configuración declarativa (Git) y secretos cifrados con clave independiente del sitio primario.
2. **Respaldos de plataforma y aislamiento 3-2-1:** Programa backups inmutables/versionados de clúster y snapshots CSI con `Velero` (y `pgBackRest`/`Barman` para bases transaccionales) hacia otra cuenta, región o datacenter independiente.
3. **Degradación elegante y colas resilientes:** Garantiza que fallos de caché (`Valkey`) degraden limpiamente a base de datos sin tumbar lecturas, y valida el procedimiento de inspección y redrive controlado de mensajes en `DLQ`.
4. **Failover ensayado e ingeniería del caos:** Prueba `fencing`, `failback`, pérdida de nodo/zona e inyección de fallos controlados con `Chaos Mesh` en `staging`, documentando GameDays trimestrales con medición cronometrada de RTO/RPO.

## Qué Hacer Y Qué NO Hacer (Límites Senior)

- ✅ **Hacer:** Ubicar réplicas de estado y repositorios de backup en dominios físicos de fallo distintos y mantener la llave de descifrado fuera del único host productivo.
- ❌ **No hacer:** Creer que `restart: unless-stopped` o tres contenedores sobre el mismo disco protegen contra caída de hardware, usar sincronización destructiva (`rsync --delete`) como backup o declarar DR probado sin haber ejecutado un GameDay real.
- ❌ **No hacer:** Automatizar failover de base de datos (ej. Patroni) si el equipo no ha probado `fencing` ni prevención de *split-brain*.

## Respuesta

Resume primero salud, riesgo y acción.

Usa frases cortas.

Incluye evidencia, costos, pruebas y ejemplos aplicables.

## ✅ Correcto / ❌ Incorrecto: manejo de existente

- ✅ **Correcto:** Respaldar estado y manifiestos hacia dominios de fallo aislados con retención inmutable y certificar RPO/RTO reales mediante simulacros de restauración, redrive de `DLQ` y `Chaos Mesh`.
- ❌ **Incorrecto:** Mantener backups en la misma cuenta/host que producción, carecer de runbooks ejecutables o marcar simulacros multi-zona como `PASS` desde una sola laptop.
- **Gate:** no reescribir masivamente código heredado; inspeccionar baseline, tests y locks reales; reportar `NOT_RUN` si falta evidencia. La guía de refactor se consulta en `vigilio-docs/standards/engineering/refactoring-existing-code.md` según la revisión de Docs aprobada (no asumir que el link remoto `main` ya esté publicado).

</skill-content>

## Guías de librerías por versión — lectura antes de usar sus APIs

Las versiones de esta skill no se copian aquí: comprobar lockfile y [versión canónica](../.vigilio-docs/technology/versions.md). Cuando la tarea utilice una de estas dependencias, **abrir el `.md` completo** y consultar su migración ✅/❌ antes de escribir código; el resto no es obligatorio para una tarea que no la utiliza.

✅ Correcto: versionar el consumidor y seguir los ejemplos de la API instalada; enlazar documento propietario.  ❌ Incorrecto: copiar APIs legacy, duplicar normas en la skill o instalar nuevas dependencias sin gate.
