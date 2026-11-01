---
name: ux-game-experience
description: Especialista UI para juegos 2D/3D: HUD, mando, menús, narrativa y accesibilidad.
owner: governance-platform
lifecycle: stable
introduced_in: 0.7.0
routing_ecosystems: "godot,game"
routing_keywords: "hud,ui juego,menu juego,gamepad,controles,juego 2d,juego 3d,game ux,interfaz juego"
routing_files: "package.json"
routing_capabilities: "feature"
requires: []
optional: []
conflicts: []
supersedes: []
---

# ux-game-experience — procedimiento Senior/Staff

## Condiciones de activación

Usar solo ante una solicitud UI/UX o flujo de producto pertinente. Si no hay repositorio, ofrecer opciones y decidir con el usuario únicamente lo irreversible. Si existe, inspeccionar stack, pantallas, estilos, tokens, tests y decisiones de producto; no reemplazar diseño aprobado sin justificación. **El router solo sugiere; el agente debe abrir este documento y las guías antes de afirmar su lectura.**

## Gameplay y experiencia de usuario

Identificar género, cámara, resolución, input, ritmo, tono, estilo e historia. HUD comunica gameplay sin duplicar fuente de verdad; gamepad focus y rebind explícitos; caption/feedback para audio; remap y texto escalable. Godot Theme/type variations consumen tokens. No imponer HUD de RPG a un FPS.

## Entrega verificable

Escena de menú + HUD con pruebas manuales por input y dispositivos; además casos derrota, pausa, latencia, reconexión y subtítulos cuando aplicables.

## Evaluación y riesgos

Usar Godot real para confirmar foco, SFX y HUD. Headless import no es prueba jugable.

**Evidencia mínima:** fuente canónica leída; rutas/archivos tocados si se implementó; impacto a consumidores; tests `PASS/FAIL/BLOCKED/NOT_RUN`; revisión independiente solo lectura; decisiones y preguntas que no pueden inferirse del proyecto. Prohibido afirmar puntuación perfecta por propuesta visual o test no ejecutado.

## Fuentes canónicas y referencias de aplicación

- [Blueprints UX/UI originales por producto](../.vigilio-docs/standards/experience/product-originality-and-platform-blueprints.md)

- [Guía especializada](../.vigilio-docs/stacks/godot/ui/game-ux-accessibility-and-art-direction.md)
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

