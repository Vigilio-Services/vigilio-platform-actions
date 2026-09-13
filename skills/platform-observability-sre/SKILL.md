---
name: platform-observability-sre
description: Diseña y revisa contratos de observabilidad y SRE. Usar para OpenTelemetry, logs, métricas, trazas, Prometheus, Grafana, Alertmanager, SLO, alertas, cardinalidad, redacción, retención y costos.
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

</skill-content>
