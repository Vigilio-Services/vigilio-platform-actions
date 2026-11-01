---
name: platform-observability-sre
description: Diseña y revisa contratos de observabilidad y SRE. Usar para OpenTelemetry, logs, métricas, trazas, Prometheus, Grafana, Alertmanager, SLO, alertas, cardinalidad, redacción, retención y costos.
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

# Observabilidad Y SRE

## Lectura obligatoria de referencias

Lee completamente [references/observability-contract.md](references/observability-contract.md).

Abre cada fuente canónica aplicable.

No cierres gates cuando una fuente requerida resulte inaccesible.

## Flujo

1. Identifica resultados críticos del usuario.
2. Define SLIs, objetivos y ventanas.
3. Instrumenta logs, métricas y trazas correlacionadas.
4. Limita cardinalidad, muestreo y retención.
5. Redacta secretos y PII antes de exportar.
6. Crea dashboards desde preguntas operativas.
7. Alerta mediante consumo del error budget.
8. Enlaza alertas con runbooks y propietarios.
9. Clasifica herramientas por estado verificable.
10. Prueba señales, alertas y costos.

## Límites

- No declares herramientas adoptadas sin evidencia.
- No uses identificadores únicos como labels.
- No registres bodies completos.
- No alertes sin acción definida.
- No dupliques backends sin justificar responsabilidades.

## Respuesta

Resume primero salud, riesgo y acción.

Usa frases cortas.

Incluye evidencia, costos, pruebas y ejemplos aplicables.


## ✅ Correcto / ❌ Incorrecto: manejo de existente

- ✅ **Correcto:** Instrumentar logs estructurados con correlación OTel, métricas de baja cardinalidad, SLO y privacidad verificable.
- ❌ **Incorrecto:** Loguear tokens/PII/payloads completos, usar ID de usuario como etiqueta Prometheus o declarar trazas sin exportador.
- **Gate:** no reescribir masivamente código heredado; inspeccionar baseline, tests y locks reales; reportar `NOT_RUN` si falta evidencia. La guía de refactor se consulta en `vigilio-docs/standards/engineering/refactoring-existing-code.md` según la revisión de Docs aprobada (no asumir que el link remoto `main` ya esté publicado).

</skill-content>

## Guías de librerías por versión — lectura antes de usar sus APIs

Las versiones de esta skill no se copian aquí: comprobar lockfile y [versión canónica](../.vigilio-docs/technology/versions.md). Cuando la tarea utilice una de estas dependencias, **abrir el `.md` completo** y consultar su migración ✅/❌ antes de escribir código; el resto no es obligatorio para una tarea que no la utiliza.
- [opentelemetry](../.vigilio-docs/technology/libraries/opentelemetry.md)
- [prom-client](../.vigilio-docs/technology/libraries/prom-client.md)
- [prometheus](../.vigilio-docs/technology/libraries/prometheus.md)
- [grafana](../.vigilio-docs/technology/libraries/grafana.md)

✅ Correcto: versionar el consumidor y seguir los ejemplos de la API instalada; enlazar documento propietario.  ❌ Incorrecto: copiar APIs legacy, duplicar normas en la skill o instalar nuevas dependencias sin gate.

