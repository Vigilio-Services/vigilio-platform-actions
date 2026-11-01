---
name: ux-web-experience
description: Especialista UX web/React: semántica, formularios, navegación, responsive y performance.
owner: governance-platform
lifecycle: stable
introduced_in: 0.7.0
routing_ecosystems: "web,react"
routing_keywords: "web ux,pagina web,landing,interfaz web,dashboard,checkout,formulario,responsive,boton web,react ui"
routing_files: "package.json"
routing_capabilities: "feature"
requires: []
optional: []
conflicts: []
supersedes: []
---

# ux-web-experience — procedimiento Senior/Staff

## Condiciones de activación

Usar solo ante una solicitud UI/UX o flujo de producto pertinente. Si no hay repositorio, ofrecer opciones y decidir con el usuario únicamente lo irreversible. Si existe, inspeccionar stack, pantallas, estilos, tokens, tests y decisiones de producto; no reemplazar diseño aprobado sin justificación. **El router solo sugiere; el agente debe abrir este documento y las guías antes de afirmar su lectura.**

## Diseño semántico orientado a tareas

Leer stack real, CSS vars/tokens existentes, router, microfrontends y design system. Diseñar componentes HTML nativos/ARIA solo cuando necesario. Estado y auth no mezclados en render. Usar layout responsive basado en contenido y preferencias de usuario. Performance LCP/INP/CLS cuando aplica.

## Entrega verificable

Una ruta completa con loading, error, vacíos, teclado y pruebas E2E; sin inventar validación de pagos a partir de formularios.

## Evaluación y riesgos

Playwright o equivalente + a11y automated + manual SR, mobile emulation y verificación de performance con baseline.

**Evidencia mínima:** fuente canónica leída; rutas/archivos tocados si se implementó; impacto a consumidores; tests `PASS/FAIL/BLOCKED/NOT_RUN`; revisión independiente solo lectura; decisiones y preguntas que no pueden inferirse del proyecto. Prohibido afirmar puntuación perfecta por propuesta visual o test no ejecutado.

## Fuentes canónicas y referencias de aplicación

- [Blueprints UX/UI originales por producto](../.vigilio-docs/standards/experience/product-originality-and-platform-blueprints.md)

- [Guía especializada](../.vigilio-docs/stacks/frontend/web-mfe/ui/uxui-web-performance-accessibility.md)
- [Norma UX/UI](../.vigilio-docs/standards/experience/README.md)
- [Accesibilidad](../.vigilio-docs/standards/experience/accessibility-inclusive-interactions.md)
- [Gates UX/UI](../.vigilio-docs/standards/experience/ux-quality-gates-and-ci-cd.md)
- [Review](../.vigilio-docs/standards/engineering/change-impact-and-review-gates.md)
- [Ejecución y casos adversarios](references/execution.md)

## ✅ Correcto / ❌ Incorrecto

- ✅ **Correcto:** usar contexto del producto, abrir fuentes, validar accesibilidad/comportamiento real y registrar pruebas ejecutadas.
- ❌ **Incorrecto:** imponer un diseño genérico, afirmar carga de skill no leída o etiquetar un mock/propuesta como E2E aprobado.


## Lectura obligatoria de referencias

Consultar las referencias locales del módulo antes de ejecutar modificaciones normativas.

