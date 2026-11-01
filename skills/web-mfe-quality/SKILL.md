---
name: web-mfe-quality
description: Revisa y mejora accesibilidad, SEO, Core Web Vitals, rendimiento de render, bundle, imagenes, cache y observabilidad frontend en web-mfe. Usar al modificar UI visible, rutas publicas, metadata, estilos, assets, carga diferida, tablas grandes, canvas, lightweight-charts, OGL/WebGL, telemetria, logging, dashboards o budgets de performance.
owner: frontend-platform
lifecycle: stable
introduced_in: 0.7.0
routing_ecosystems: "web, frontend, react, preact, typescript"
routing_keywords: "biome, eslint, a11y, lighthouse, seo"
routing_files: "package.json, vite.config.ts"
routing_capabilities: "quality, a11y, performance"
requires: [web-mfe-technologies]
optional: []
conflicts: []
supersedes: []
---

<skill-content>

# Calidad Web MFE

## Lectura obligatoria de referencias

Antes de actuar, leer de principio a fin cada archivo `references/*` enlazado por esta skill. Dentro
de cada referencia aplicable, abrir y leer completas todas las fuentes canónicas enlazadas; no basta
con leer títulos, tablas o resúmenes. Si una fuente requerida no es accesible, identificarla y no
afirmar cumplimiento ni cerrar el gate que dependa de ella.

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


## ✅ Correcto / ❌ Incorrecto: manejo de existente

- ✅ **Correcto:** Componentes enfocados, contratos compartidos, estados explícitos, accesibilidad y `map()` puro para renderizar listas con keys estables.
- ❌ **Incorrecto:** `map()` para efectos ignorando el retorno, `forEach(async...)` sin esperar, duplicar schemas y renderizar HTML no confiable.
- **Gate:** no reescribir masivamente código heredado; inspeccionar baseline, tests y locks reales; reportar `NOT_RUN` si falta evidencia. La guía de refactor se consulta en `vigilio-docs/standards/engineering/refactoring-existing-code.md` según la revisión de Docs aprobada (no asumir que el link remoto `main` ya esté publicado).

</skill-content>

## Guías de librerías por versión — lectura antes de usar sus APIs

Las versiones de esta skill no se copian aquí: comprobar lockfile y [versión canónica](../.vigilio-docs/technology/versions.md). Cuando la tarea utilice una de estas dependencias, **abrir el `.md` completo** y consultar su migración ✅/❌ antes de escribir código; el resto no es obligatorio para una tarea que no la utiliza.
- [typescript](../.vigilio-docs/technology/catalog/typescript.md)
- [biome](../.vigilio-docs/technology/libraries/biome.md)
- [vite](../.vigilio-docs/technology/libraries/vite.md)
- [vitest](../.vigilio-docs/technology/libraries/vitest.md)
- [playwright](../.vigilio-docs/technology/libraries/playwright.md)
- [tailwind-css](../.vigilio-docs/technology/libraries/tailwind-css.md)

✅ Correcto: versionar el consumidor y seguir los ejemplos de la API instalada; enlazar documento propietario.  ❌ Incorrecto: copiar APIs legacy, duplicar normas en la skill o instalar nuevas dependencias sin gate.

## APIs complementarias por versión

- [testing-library](../.vigilio-docs/technology/libraries/testing-library.md)

✅ Correcto: abrir guías cuando la funcionalidad las use. ❌ Incorrecto: importar código legacy de otro major sin confirmar manifest.

