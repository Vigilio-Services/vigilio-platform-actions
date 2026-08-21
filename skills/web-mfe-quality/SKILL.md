---
name: web-mfe-quality
description: Revisa y mejora accesibilidad, SEO, Core Web Vitals, rendimiento de render, bundle, imagenes, cache y observabilidad frontend en web-mfe. Usar al modificar UI visible, rutas publicas, metadata, estilos, assets, carga diferida, tablas grandes, canvas, lightweight-charts, OGL/WebGL, telemetria, logging, dashboards o budgets de performance.
---

<skill-content>

# Calidad Web MFE

Medir antes y despues. No declarar mejoras de rendimiento, SEO o accesibilidad sin evidencia ejecutable.

## Orden de trabajo

1. Identificar si la ruta es publica/indexable o privada/de aplicacion.
2. Verificar HTML semantico, teclado, focus, labels, contraste y reduced motion.
3. Revisar carga critica: JS/CSS, fonts, imagenes, waterfalls y cache.
4. Medir LCP, INP y CLS con datos de laboratorio y, cuando exista trafico, RUM.
5. Mantener observabilidad sin secretos/PII y con correlacion hacia el backend.
6. Ejecutar tests de accesibilidad, build y budget de bundle.

## SEO

- Solo rutas publicas necesitan indexacion, canonical, metadata social y datos estructurados.
- Rutas autenticadas deben evitar indexacion y no fingir SEO con contenido inaccesible al crawler.
- Cada pagina publica tiene title y description unicos, headings jerarquicos y enlaces rastreables.

## Performance

- Dividir por ruta/feature cuando reduce el camino critico; no fragmentar en chunks diminutos.
- Reservar dimensiones de imagenes y contenido async para evitar CLS.
- Virtualizar tablas/listas solo con volumen medido que lo justifique.
- No memoizar por reflejo; usar profiler y estabilidad de props.
- Canvas financiero requiere alternativa accesible y actualizaciones incrementales; no repintar el historial completo por tick.
- OGL requiere un canvas máximo por página, lazy boundary, reduced-motion/fallback, DPR cap, pausa fuera de vista y presupuesto GPU/bundle medido.
- Mantener budgets versionados y hacer fallar CI ante regresiones relevantes.

## Observabilidad

- Capturar Web Vitals, errores no controlados, fallos de recurso y operaciones HTTP relevantes.
- Propagar correlation/request ID cuando el backend lo provea.
- Enviar telemetria a un collector/backend controlado; el navegador no escribe directamente a CloudWatch o Grafana con credenciales.
- Grafana visualiza metricas/logs/traces provenientes de la plataforma; no es SDK de instrumentacion del componente.
- Aplicar sampling, redaction y limites de cardinalidad.

Leer [references/quality-checklist.md](references/quality-checklist.md) antes de cerrar una ruta o cambio visual importante.

</skill-content>
