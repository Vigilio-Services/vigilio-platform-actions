---
name: godot-backend-multiplayer
description: Conectar juegos Godot a API, login, guardado nube, backend y servidor multijugador autoritativo.
owner: governance-platform
lifecycle: stable
introduced_in: 0.7.0
routing_ecosystems: "godot"
routing_keywords: "godot,backend,multijugador,multiplayer,online,login,servidor,lobby,api,http,leaderboard,pagos"
routing_files: "project.godot"
routing_capabilities: "networking"
requires: []
optional: []
conflicts: []
supersedes: []
---

# godot-backend-multiplayer — Senior/Staff videojuegos 2D/3D

## Activación por Auto-Senior

El agente **debe** abrir esta `SKILL.md` en su totalidad y las referencias aplicables. El router solo emite `PROPOSED_NOT_LOADED`; jamás declarar `LOADED` sin lectura observable. Esta skill es para proyectos Godot 4.x o ideas de juegos donde Godot sea opción; no obliga motor ni backend si aún se compara el stack.

## Fuentes canónicas obligatorias

- [stacks/godot/networking/backend-api-integration.md](../.vigilio-docs/stacks/godot/networking/backend-api-integration.md)
- [stacks/godot/networking/authoritative-multiplayer.md](../.vigilio-docs/stacks/godot/networking/authoritative-multiplayer.md)
- [stacks/godot/security/cheats-modding-and-privacy.md](../.vigilio-docs/stacks/godot/security/cheats-modding-and-privacy.md)

- [Política de descubrimiento dinámico](../.vigilio-docs/standards/ai/dynamic-capability-discovery.md).
- [Code review por impactos](../.vigilio-docs/standards/engineering/change-impact-and-review-gates.md).

## Plan operativo aplicado

1. **DISCOVER:** inspeccionar `project.godot`, versión real Godot, `.tscn`, `.tres`, `addons`, InputMap, audio buses, scripts y el árbol propietario. No asumir que GDScript y C# tienen el mismo soporte multiplataforma.
2. **ANALYZE:** diagnosticar género, 2D/3D, controlador, estado actual, requisitos de plataformas, input, assets y permisos. Separar gameplay local de infraestructura online.
3. **DECIDE:** recomendar propuesta principal y alternativa, sus costes/performance/licencias. Preguntar solo decisiones que cambien la arquitectura: plataforma objetivo, online/offline, 2D/3D y producto con monetización o datos sensibles.
4. **READ:** consultar las normas listadas y enlaces oficiales de la versión realmente instalada, registrar la evidencia (ruta + hash o output de lector).
5. **BUILD:** código mínimo por feature con escenas y recursos cohesionados, soporte para audio/música/animación cuando lo solicite el comportamiento; no introducir monolito de AutoLoads.
6. **VERIFY:** ejecutar importación headless, unit/scene tests, tests visibles jugables y E2E de backend si existe, además de regresiones y assets/licencias. `NOT_RUN` y `BLOCKED` nunca equivalen a `PASS`.
7. **REVIEW:** invocar `review-code-change` en fase read-only sobre diff real y call sites; analizar colisiones, recursos compartidos, FPS, seguridad cliente-servidor y plataformas.
8. **REPORT:** archivos, fuentes leídas, comandos/exit codes, resultado de pruebas, riesgos y calificación 1–10 sustentada en evidencia.

## Diseño funcional específico

backend,multiplayer. En 2D verificar salto/aterrizaje, físicas y input. En 3D verificar cámaras, colisiones, imports y AnimationTree. Para audio SFX utilizar buses independientes y señales; la ausencia de un archivo de sonido no puede bloquear la regla del salto.

## Pruebas negativas obligatorias según alcance

- Sin `project.godot` o sin Godot CLI: reportar `BLOCKED`, no inventar un build.
- Asset/música sin licencia o archivo ausente: no publicar release.
- Test headless exitoso **no** demuestra gráficos/audio reales; comprobar E2E en runner apropiado.
- Backend online: no guardar claves privilegiadas en cliente y comprobar autorización server-side, replay y desconexión.

## ✅ Correcto / ❌ Incorrecto

- ✅ **Correcto:** seleccionar docs pertinentes, validar señales/código en proyecto real, probarlo y revisar impactos.
- ❌ **Incorrecto:** declarar 10/10 sin test real, duplicar la música en cada `Node`, aceptar daño/moneda premium del cliente o imponer multijugador a un juego offline.

