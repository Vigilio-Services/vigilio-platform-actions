---
name: ui-interaction-motion
description: Motion, microinteracciones, animation, feedback, haptics y SFX al servicio de la tarea.
owner: governance-platform
lifecycle: stable
introduced_in: 0.7.0
routing_ecosystems: "any"
routing_keywords: "microinteracciones,motion,animacion ui,transicion,feedback visual,haptics,animaciones interfaz,efecto hover,salto audio"
routing_files: "package.json"
routing_capabilities: "feature"
requires: []
optional: []
conflicts: []
supersedes: []
---

# ui-interaction-motion — procedimiento Senior/Staff

## Condiciones de activación

Usar solo ante una solicitud UI/UX o flujo de producto pertinente. Si no hay repositorio, ofrecer opciones y decidir con el usuario únicamente lo irreversible. Si existe, inspeccionar stack, pantallas, estilos, tokens, tests y decisiones de producto; no reemplazar diseño aprobado sin justificación. **El router solo sugiere; el agente debe abrir este documento y las guías antes de afirmar su lectura.**

## Diseño de respuesta

Inventariar estados y triggers antes de animar. Definir feedback instantáneo, cancelación, reduced motion, prioridad semántica. Distinguir Tween Godot/GPUI/Qt/web y evitar bloquear UI thread. Audio o vibración nunca como única señal crítica.

## Entrega verificable

Tabla evento → feedback visual/acústico/háptico → duración → reduce motion → límites de repetición; medir latencia perceptiva.

## Evaluación y riesgos

Tests spam, pausa, cambio escena, foco perdido, dispositivo silencioso y frame pacing.

**Evidencia mínima:** fuente canónica leída; rutas/archivos tocados si se implementó; impacto a consumidores; tests `PASS/FAIL/BLOCKED/NOT_RUN`; revisión independiente solo lectura; decisiones y preguntas que no pueden inferirse del proyecto. Prohibido afirmar puntuación perfecta por propuesta visual o test no ejecutado.

## Fuentes canónicas y referencias de aplicación

- [Guía especializada](../.vigilio-docs/standards/experience/motion-feedback-and-haptics.md)
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

