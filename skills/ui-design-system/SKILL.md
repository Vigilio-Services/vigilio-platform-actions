---
name: ui-design-system
description: Construye componentes, tokens, modos y contratos reutilizables sin abstraer en exceso.
owner: governance-platform
lifecycle: stable
introduced_in: 0.7.0
routing_ecosystems: "any"
routing_keywords: "design system,sistema diseño,tokens,variables,componentes,reutilizables,tema oscuro,theming,component library,botones,hud"
routing_files: "package.json"
routing_capabilities: "feature"
requires: []
optional: []
conflicts: []
supersedes: []
---

# ui-design-system — procedimiento Senior/Staff

## Condiciones de activación

Usar solo ante una solicitud UI/UX o flujo de producto pertinente. Si no hay repositorio, ofrecer opciones y decidir con el usuario únicamente lo irreversible. Si existe, inspeccionar stack, pantallas, estilos, tokens, tests y decisiones de producto; no reemplazar diseño aprobado sin justificación. **El router solo sugiere; el agente debe abrir este documento y las guías antes de afirmar su lectura.**

## Inventario y modelo de tokens

Audita sistema existente primero. Crea primitives/semantic/component tokens con aliases sin ciclos; estados para componentes. Diseña modos light/dark/high contrast cuando solicitados y variaciones por plataforma. Defiende por qué una composición se comparte sin mezclar contratos de negocio. Tokens deben evolucionar con versión, test y migraciones.

## Entrega verificable

Entregar mapa token → componente → estado → pantalla, variante y ownership; no generar 40 componentes base si 5 bastan. En Godot usar Theme/type variations, en web CSS vars, en Qt QPalette/Style, en GPUI theme derivado.

## Evaluación y riesgos

Ejecutar token checker, pruebas de contraste, visual review, estados negativos y regresión de consumidores.

**Evidencia mínima:** fuente canónica leída; rutas/archivos tocados si se implementó; impacto a consumidores; tests `PASS/FAIL/BLOCKED/NOT_RUN`; revisión independiente solo lectura; decisiones y preguntas que no pueden inferirse del proyecto. Prohibido afirmar puntuación perfecta por propuesta visual o test no ejecutado.

## Fuentes canónicas y referencias de aplicación

- [Guía especializada](../.vigilio-docs/standards/experience/design-tokens-modes-and-theming.md)
- [Norma UX/UI](../.vigilio-docs/standards/experience/README.md)
- [Accesibilidad](../.vigilio-docs/standards/experience/accessibility-inclusive-interactions.md)
- [Gates UX/UI](../.vigilio-docs/standards/experience/ux-quality-gates-and-ci-cd.md)
- [Review](../.vigilio-docs/standards/engineering/change-impact-and-review-gates.md)
- [Ejecución y casos adversarios](references/execution.md)

## ✅ Correcto / ❌ Incorrecto

- ✅ **Correcto:** usar contexto del producto, abrir fuentes, validar accesibilidad/comportamiento real y registrar pruebas ejecutadas.
- ❌ **Incorrecto:** imponer un diseño genérico, afirmar carga de skill no leída o etiquetar un mock/propuesta como E2E aprobado.

**Ownership por feature:** si esta tarea mueve constantes, tipos, Resources, componentes o utilidades, abrir [file-and-symbol-ownership](../.vigilio-docs/standards/engineering/file-and-symbol-ownership.md) y la guía específica del stack. No forzar carpetas globales por defecto.


## Lectura obligatoria de referencias

Consultar las referencias locales del módulo antes de ejecutar modificaciones normativas.

