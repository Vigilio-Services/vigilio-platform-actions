---
name: ux-product-discovery
description: Investiga el problema real y propone dirección UX específica antes de imponer stack o paleta.
owner: governance-platform
lifecycle: stable
introduced_in: 0.7.0
routing_ecosystems: "any"
routing_keywords: "login,pantalla login,discovery,flujo usuario,fintech,experiencia usuario,usuario objetivo,problema usuario,producto digital,crear una app,quiero un videojuego"
routing_files: "package.json"
routing_capabilities: "architecture"
requires: []
optional: []
conflicts: []
supersedes: []
---

# ux-product-discovery — procedimiento Senior/Staff

## Condiciones de activación

Usar solo ante una solicitud UI/UX o flujo de producto pertinente. Si no hay repositorio, ofrecer opciones y decidir con el usuario únicamente lo irreversible. Si existe, inspeccionar stack, pantallas, estilos, tokens, tests y decisiones de producto; no reemplazar diseño aprobado sin justificación. **El router solo sugiere; el agente debe abrir este documento y las guías antes de afirmar su lectura.**

## Objetivo y límites de la tarea

Construye brief con tareas, entorno, usuarios, riesgos, restricciones y evidencia disponible. Diferencia investigación observada de supuestos. Antes de un greenfield, recomienda 2 rutas viables de plataforma, riesgos e interacciones prioritarias. No simules entrevistas. Para fintech incluye integridad financiera/confirmaciones; para juego incluye input, pacing, progresión y accesibilidad.

## Entrega verificable

Ficha de producto con segmentos, JTBD, hipótesis, fricciones, métrica, preguntas bloqueantes y plan de validación. El flujo login debe distinguir identidad/autenticación real de pantalla propuesta.

## Evaluación y riesgos

La app puede seguir sin stack seleccionado. No implementar por defecto; si usuario pidió solo arquitectura, permanecer PLAN. Éxito significa decisión defendible, no conversión demostrada.

**Evidencia mínima:** fuente canónica leída; rutas/archivos tocados si se implementó; impacto a consumidores; tests `PASS/FAIL/BLOCKED/NOT_RUN`; revisión independiente solo lectura; decisiones y preguntas que no pueden inferirse del proyecto. Prohibido afirmar puntuación perfecta por propuesta visual o test no ejecutado.

## Fuentes canónicas y referencias de aplicación

- [Guía especializada](../.vigilio-docs/standards/experience/product-discovery-and-research.md)
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

