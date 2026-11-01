---
name: ux-accessibility
description: Garantiza planificación y pruebas de accesibilidad conforme a plataforma y capacidad real.
owner: governance-platform
lifecycle: stable
introduced_in: 0.7.0
routing_ecosystems: "any"
routing_keywords: "login,pantalla login,accesibilidad,wcag,lector pantalla,contraste,focus,teclado,subtitulos,gamepad,remapeo,alto contraste"
routing_files: "package.json"
routing_capabilities: "accessibility"
requires: []
optional: []
conflicts: []
supersedes: []
---

# ux-accessibility — procedimiento Senior/Staff

## Condiciones de activación

Usar solo ante una solicitud UI/UX o flujo de producto pertinente. Si no hay repositorio, ofrecer opciones y decidir con el usuario únicamente lo irreversible. Si existe, inspeccionar stack, pantallas, estilos, tokens, tests y decisiones de producto; no reemplazar diseño aprobado sin justificación. **El router solo sugiere; el agente debe abrir este documento y las guías antes de afirmar su lectura.**

## Matriz de capacidades accesibles

Audita stack y rutas críticas; define target WCAG para web, HIG iOS, Android, desktop nativo y controles Godot sin mezclar unidades. Verifica semántica/nombre, focus, teclado, táctil/mando, zoom, reduced motion, color, captions y errores. Exige prueba real con asistencia técnica cuando se reclama compliance.

## Entrega verificable

Matriz WCAG/OS/input vs pantalla/escena, responsable, evidencia, excepción justificada, severidad. No afirmar certificación automática por checker.

## Evaluación y riesgos

Negativos: focus trap, ausencia de subtitles, botón <24 CSS px sin excepción, gesto único obligatorio, falta de labels.

**Evidencia mínima:** fuente canónica leída; rutas/archivos tocados si se implementó; impacto a consumidores; tests `PASS/FAIL/BLOCKED/NOT_RUN`; revisión independiente solo lectura; decisiones y preguntas que no pueden inferirse del proyecto. Prohibido afirmar puntuación perfecta por propuesta visual o test no ejecutado.

## Fuentes canónicas y referencias de aplicación

- [Guía especializada](../.vigilio-docs/standards/experience/accessibility-inclusive-interactions.md)
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

