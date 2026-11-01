---
name: platform-resilience-disaster-recovery
description: Diseña continuidad de negocio, backups de estado con Velero, conmutación multi-región e ingeniería del caos.
owner: governance-platform
lifecycle: experimental
introduced_in: 0.8.0
routing_ecosystems: "cross-stack"
routing_keywords: "disaster-recovery, velero, chaos-mesh, backup, rpo, rto, failover"
routing_files: "velero-schedule.yaml, values.yaml, kustomization.yaml"
routing_capabilities: "sre-resilience, disaster-recovery"
requires: []
optional: []
conflicts: []
supersedes: []
---

<skill-content>

# Resiliencia Y Recuperación Ante Desastres (DR)

## Lectura obligatoria de referencias

Lee completamente [references/canonical-contract.md](references/canonical-contract.md).

Abre cada fuente canónica aplicable.

No cierres gates cuando una fuente requerida resulte inaccesible.

## Flujo

1. Define objetivos de RPO y RTO por nivel de criticidad de servicio.
2. Programa backups automáticos de manifiestos y snapshots CSI con Velero.
3. Configura estrategias de contingencia activa o réplica fría en regiones secundarias.
4. Ejecuta ejercicios periódicos de inyección de fallos con Chaos Mesh en staging.
5. Valida procedimientos de restauración completa trimestralmente (GameDays).

## Límites

- No asumir que un backup es funcional sin haber realizado pruebas de restore verificadas.
- No mantener backups en la misma cuenta o región donde reside la infraestructura primaria.
- No ignorar dependencias cruzadas entre servicios durante simulacros de contingencia.

## Respuesta

Resume primero salud, riesgo y acción.

Usa frases cortas.

Incluye evidencia, costos, pruebas y ejemplos aplicables.

## ✅ Correcto / ❌ Incorrecto: manejo de existente

- ✅ **Correcto:** Automatizar respaldos diarios con Velero hacia cuentas aisladas y auditar el RTO mediante simulacros regulares.
- ❌ **Incorrecto:** Confiar ciegamente en backups sin validar su restauración ni contar con runbooks documentados de contingencia.
- **Gate:** no reescribir masivamente código heredado; inspeccionar baseline, tests y locks reales; reportar `NOT_RUN` si falta evidencia. La guía de refactor se consulta en `vigilio-docs/standards/engineering/refactoring-existing-code.md` según la revisión de Docs aprobada (no asumir que el link remoto `main` ya esté publicado).

</skill-content>

## Guías de librerías por versión — lectura antes de usar sus APIs

Las versiones de esta skill no se copian aquí: comprobar lockfile y [versión canónica](../.vigilio-docs/technology/versions.md). Cuando la tarea utilice una de estas dependencias, **abrir el `.md` completo** y consultar su migración ✅/❌ antes de escribir código; el resto no es obligatorio para una tarea que no la utiliza.

✅ Correcto: versionar el consumidor y seguir los ejemplos de la API instalada; enlazar documento propietario.  ❌ Incorrecto: copiar APIs legacy, duplicar normas en la skill o instalar nuevas dependencias sin gate.