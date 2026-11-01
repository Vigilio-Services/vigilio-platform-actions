# Checklist De Calidad Frontend

## Fuentes Canónicas

| Necesidad | Fuente canónica |
|---|---|
| SEO, accesibilidad y rendimiento | [vigilio-docs/8-calidad-seo-accesibilidad-rendimiento](../../.vigilio-docs/stacks/frontend/web-mfe/quality/8-calidad-seo-accesibilidad-rendimiento.md) |
| Observabilidad, RUM y Grafana | [vigilio-docs/10-observabilidad-rum-grafana-slo](../../.vigilio-docs/stacks/frontend/web-mfe/observability/10-observabilidad-rum-grafana-slo.md) |
| AWS, CloudFront y FinOps | [vigilio-docs/13-aws-cloudfront-cdk-finops](../../.vigilio-docs/stacks/frontend/web-mfe/delivery/13-aws-cloudfront-cdk-finops.md) |
| Estado y roadmap verificable | [vigilio-docs/15-evaluacion-roadmap-operacion](../../.vigilio-docs/stacks/frontend/web-mfe/governance/15-evaluacion-roadmap-operacion.md) |
| Evidencia ejecutable | build, tests, budgets y telemetría del consumidor |

Medir contra el repositorio y ambiente objetivo. No convertir una recomendación central en evidencia de implementación.

## Accesibilidad

- Landmarks y headings correctos.
- Inputs con label y errores asociados mediante `aria-describedby`.
- Focus visible y orden logico.
- Dialogs con focus trap/restore y cierre por Escape cuando aplique.
- Botones reales para acciones y enlaces reales para navegacion.
- Estados no comunicados solo por color.
- Touch targets suficientes y zoom no bloqueado.
- Animaciones respetan `prefers-reduced-motion`.

## SEO publico

- `title`, description, canonical y robots coherentes.
- Open Graph/Twitter cards cuando la pagina se comparte.
- Sitemap solo con URLs canonicas publicas.
- Structured data valido cuando representa contenido real.
- Noindex para backoffice, previews sensibles y rutas privadas.
- Status HTTP y redirects correctos desde CDN/origen.

## Performance

- Build productivo y reporte gzip/brotli revisado.
- Budget de entrypoint y chunks.
- Imagenes responsivas, formatos modernos y lazy loading fuera del viewport.
- Fonts con subset/preload solo si son criticas.
- Sin dependencias duplicadas o Node polyfills en browser.
- Charts canvas mantienen alternativa textual/tabular accesible y actualizan puntos sin reconstruir el historial por tick.
- OGL mantiene un canvas maximo por pagina, fallback/reduced motion, DPR cap y cleanup verificado de RAF/observer/contexto.
- Cache immutable para assets hasheados; HTML/runtime config con politica corta.
- Medir LCP, INP, CLS y error rate por version.

## Observabilidad

- Release/version y entorno adjuntos.
- Correlation ID propagado sin identificar al usuario.
- Redaction de tokens, emails, documentos, cuerpos y query params sensibles.
- Sampling definido por tipo de señal.
- Alertas basadas en SLO/error budget, no cada error individual.
- Dashboards Grafana separan frontend, CDN y backend para evitar atribucion falsa.

## Evidencia minima

```bash
pnpm test
pnpm build
pnpm bundle:budget
pnpm test:e2e
```

Ejecutar E2E/visual segun superficie y disponibilidad del entorno; reportar con precision lo que no se ejecuto.

> Fuente única para **Correcto / Incorrecto: manejo de existente**: [abrir documento canónico](../../.vigilio-docs/standards/engineering/refactoring-existing-code.md).

