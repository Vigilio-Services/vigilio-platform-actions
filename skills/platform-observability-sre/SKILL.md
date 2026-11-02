---
name: platform-observability-sre
description: Diseña y verifica contratos de observabilidad y SRE: correlación RUM + OTel + Prometheus/Loki/Tempo/Grafana, Alertmanager con TLS e inhibición, pruebas unitarias promtool test rules, cero PII/alta cardinalidad y burn-rate de SLOs.
owner: governance-platform
lifecycle: stable
introduced_in: 0.7.0
routing_ecosystems: "cross-stack"
routing_keywords: "observability, opentelemetry, otel, prometheus, grafana, dashboard, trace, traces, traceparent, metrics, metricas, logs, slo, sli, error-budget, burn-rate, w3c"
routing_files: "otel-collector*.yaml, prometheus*.yaml, slo*.yaml, alert*.yaml"
routing_capabilities: "observability, sre"
requires: []
optional: []
conflicts: []
supersedes: []
---

<skill-content>

# Observabilidad, Alertas Probadas Y SRE

## Lectura obligatoria de referencias

Lee completamente [references/observability-contract.md](references/observability-contract.md).

Abre cada fuente canónica aplicable.

No cierres gates cuando una fuente requerida resulte inaccesible.

## Flujo

1. **SLIs, SLOs y Correlación End-to-End:** Define SLIs centrados en el usuario y correlaciona RUM del navegador -> `OTel Collector` (W3C `traceparent`) -> `Tempo` (trazas), `Alloy` -> `Loki` (logs JSON estructurados) y `Prometheus` -> `Grafana`.
2. **Cero PII y Cardinalidad Acotada:** Redacta tokens, cookies, contraseñas y PII antes de exportar; prohíbe usar `user_id`, `order_id`, correos, SQL crudo o URLs arbitrarias en labels de métricas.
3. **Pruebas Unitarias de Reglas (`promtool`):** Valida toda regla de grabación y alerta en CI con `promtool check rules` y suites positivas/negativas `promtool test rules`, garantizando cero falsos positivos contra scrapes saludables de PostgreSQL, NATS y nodos.
4. **Ruteo Real en Alertmanager y Sondas Externas:** Configura ruteo por severidad (`critical-oncall`, `platform-warnings`, `Watchdog`/`InfoInhibitor`), reglas de inhibición, `smtp_require_tls: true`, `runbook_url` obligatorio y sondas sintéticas externas (`Blackbox`) que comprueben alcance real desde fuera del contenedor/namespace.
5. **Protección de Endpoints Sintéticos:** Cualquier endpoint interno para inyectar métricas sintéticas de prueba debe responder `404` fuera de `local`/`development` y bloquearse mediante política Conftest en `preview`, `staging` y `production`.

## Qué Hacer Y Qué NO Hacer (Límites Senior)

- ✅ **Hacer:** Co-versionar dashboards y alertas junto a los SLOs del producto (`<product>-deploy/observability/` en Compose o chart de activos en GitOps) y probar entrega/silencio/resolución de alertas (ej. contra Mailpit en `prod-local`).
- ❌ **No hacer:** Alertar por CPU aislada sin impacto en error budget ni `runbook_url`, registrar payloads HTTP completos, exponer puertos internos de Prometheus/Tempo sin autenticación o declarar observabilidad lista sin un receptor real configurado en producción.

## Respuesta

Resume primero salud, riesgo y acción.

Usa frases cortas.

Incluye evidencia, costos, pruebas y ejemplos aplicables.


## ✅ Correcto / ❌ Incorrecto: manejo de existente

- ✅ **Correcto:** Instrumentar correlación OTel sin PII, acotar cardinalidad de labels, exigir `promtool test rules` positivo/negativo en CI y alertar por burn-rate de SLO con `runbook_url`.
- ❌ **Incorrecto:** Loguear tokens/PII, usar IDs de usuario como label Prometheus, desplegar reglas de alerta sin tests o dejar endpoints de prueba habilitados en producción.
- **Gate:** no reescribir masivamente código heredado; inspeccionar baseline, tests y locks reales; reportar `NOT_RUN` si falta evidencia. La guía de refactor se consulta en `vigilio-docs/standards/engineering/refactoring-existing-code.md` según la revisión de Docs aprobada (no asumir que el link remoto `main` ya esté publicado).

</skill-content>

## Guías de librerías por versión — lectura antes de usar sus APIs

Las versiones de esta skill no se copian aquí: comprobar lockfile y [versión canónica](../.vigilio-docs/technology/versions.md). Cuando la tarea utilice una de estas dependencias, **abrir el `.md` completo** y consultar su migración ✅/❌ antes de escribir código; el resto no es obligatorio para una tarea que no la utiliza.
- [opentelemetry](../.vigilio-docs/technology/libraries/opentelemetry.md)
- [prom-client](../.vigilio-docs/technology/libraries/prom-client.md)
- [prometheus](../.vigilio-docs/technology/libraries/prometheus.md)
- [grafana](../.vigilio-docs/technology/libraries/grafana.md)

✅ Correcto: versionar el consumidor y seguir los ejemplos de la API instalada; enlazar documento propietario.  ❌ Incorrecto: copiar APIs legacy, duplicar normas en la skill o instalar nuevas dependencias sin gate.
