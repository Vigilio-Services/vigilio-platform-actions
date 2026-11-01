---
name: ux-desktop-experience
description: Especialista UI/UX desktop Rust GPUI o C++ Qt, con ventanas, foco, docking y productividad.
owner: governance-platform
lifecycle: stable
introduced_in: 0.7.0
routing_ecosystems: "gpui,qt"
routing_keywords: "desktop ux,escritorio,windows,macos,linux,docking,atajos,command palette,paneles,ventanas"
routing_files: "package.json"
routing_capabilities: "feature"
requires: []
optional: []
conflicts: []
supersedes: []
---

# ux-desktop-experience — procedimiento Senior/Staff

## Condiciones de activación

Usar solo ante una solicitud UI/UX o flujo de producto pertinente. Si no hay repositorio, ofrecer opciones y decidir con el usuario únicamente lo irreversible. Si existe, inspeccionar stack, pantallas, estilos, tokens, tests y decisiones de producto; no reemplazar diseño aprobado sin justificación. **El router solo sugiere; el agente debe abrir este documento y las guías antes de afirmar su lectura.**

## Ventanas, input y densidad

Detectar GPUI vs Qt; abrir guía particular y fuentes de toolkit. Separar modelo persistente de ViewState y render, accesibilidad de sistema, IME, foco, tab, shortcut conflict y múltiples monitores. Medir threading y respuesta real. Densidad para profesionales sin sacrificar targets accesibles.

## Entrega verificable

Golden path de crear/abrir/editar/guardar, error/recovery, teclado sin ratón y persistencia de layout. El agente no debe elegir Qt porque dice desktop.

## Evaluación y riesgos

Pruebas UI nativas y screen reader solo donde toolkit soporte y pueda demostrarse; reportar limitaciones.

**Evidencia mínima:** fuente canónica leída; rutas/archivos tocados si se implementó; impacto a consumidores; tests `PASS/FAIL/BLOCKED/NOT_RUN`; revisión independiente solo lectura; decisiones y preguntas que no pueden inferirse del proyecto. Prohibido afirmar puntuación perfecta por propuesta visual o test no ejecutado.

## Fuentes canónicas y referencias de aplicación

- [Blueprints UX/UI originales por producto](../.vigilio-docs/standards/experience/product-originality-and-platform-blueprints.md)

- [Guía especializada](../.vigilio-docs/stacks/cpp/desktop/uxui-qt-widgets.md)
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

