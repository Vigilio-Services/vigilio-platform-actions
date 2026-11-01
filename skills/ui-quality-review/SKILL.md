---
name: ui-quality-review
description: Audita UX/UI por riesgo; accesibilidad, performance, estados, originalidad y CI.
owner: governance-platform
lifecycle: stable
introduced_in: 0.7.0
routing_ecosystems: "any"
routing_keywords: "auditoria visual,review visual,ux review,ui review,design qa,auditoria ux,testing interfaz,prueba accesibilidad,review diseño"
routing_files: "package.json"
routing_capabilities: "testing"
requires: []
optional: []
conflicts: []
supersedes: []
---

# ui-quality-review — procedimiento Senior/Staff

## Condiciones de activación

Usar solo ante una solicitud UI/UX o flujo de producto pertinente. Si no hay repositorio, ofrecer opciones y decidir con el usuario únicamente lo irreversible. Si existe, inspeccionar stack, pantallas, estilos, tokens, tests y decisiones de producto; no reemplazar diseño aprobado sin justificación. **El router solo sugiere; el agente debe abrir este documento y las guías antes de afirmar su lectura.**

## Revisión independiente read-only

Auditar contra brief/versión/plataforma, sin editar durante REVIEW. Analizar flujos, tokens, semántica, estados, focus, contrast, error, performance y copy. Ejecutar checks disponibles y registrar ausencias. Distinguir estetica de calidad medible.

## Entrega verificable

Tabla de findings con severidad, localización, reproducer, riesgo, evidencia, cambio sugerido y status de gate.

## Evaluación y riesgos

No PASS automático de WCAG por checker de tokens ni por captura.

**Evidencia mínima:** fuente canónica leída; rutas/archivos tocados si se implementó; impacto a consumidores; tests `PASS/FAIL/BLOCKED/NOT_RUN`; revisión independiente solo lectura; decisiones y preguntas que no pueden inferirse del proyecto. Prohibido afirmar puntuación perfecta por propuesta visual o test no ejecutado.

## Fuentes canónicas y referencias de aplicación

- [Blueprints UX/UI originales por producto](../.vigilio-docs/standards/experience/product-originality-and-platform-blueprints.md)

- [Guía especializada](../.vigilio-docs/standards/experience/ux-quality-gates-and-ci-cd.md)
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

