---
name: ux-information-architecture
description: Diseña arquitectura de información, navegación, estado y recorridos con errores.
owner: governance-platform
lifecycle: stable
introduced_in: 0.7.0
routing_ecosystems: "any"
routing_keywords: "login,pantalla login,arquitectura informacion,flujo,journey,navegacion,menu,estructura pantallas,experiencia usuario"
routing_files: "package.json"
routing_capabilities: "architecture"
requires: []
optional: []
conflicts: []
supersedes: []
---

# ux-information-architecture — procedimiento Senior/Staff

## Condiciones de activación

Usar solo ante una solicitud UI/UX o flujo de producto pertinente. Si no hay repositorio, ofrecer opciones y decidir con el usuario únicamente lo irreversible. Si existe, inspeccionar stack, pantallas, estilos, tokens, tests y decisiones de producto; no reemplazar diseño aprobado sin justificación. **El router solo sugiere; el agente debe abrir este documento y las guías antes de afirmar su lectura.**

## Mapa de información y tareas

Inspecciona rutas/pantallas/menús actuales o describe propuesta. Traza task flows incluyendo éxito, empty, loading, error, desconexión, permiso, cancel y recuperación. Define jerarquía desde usuarios, no desde tablas. Para juegos incluye inventario, HUD, menú pausa, settings y foco; para desktop incluye atajos, paneles y ventanas.

## Entrega verificable

Mapa de flujo con transiciones, modelos de estados y responsables. Priorizar descubribilidad; no introducir breadcrumbs en juego de plataformas por plantilla.

## Evaluación y riesgos

Comprobar salida de modales, foco, navegación tras error y rutas ocultas con test manual y automatizado por plataforma.

**Evidencia mínima:** fuente canónica leída; rutas/archivos tocados si se implementó; impacto a consumidores; tests `PASS/FAIL/BLOCKED/NOT_RUN`; revisión independiente solo lectura; decisiones y preguntas que no pueden inferirse del proyecto. Prohibido afirmar puntuación perfecta por propuesta visual o test no ejecutado.

## Fuentes canónicas y referencias de aplicación

- [Guía especializada](../.vigilio-docs/standards/experience/information-architecture-and-user-flows.md)
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

