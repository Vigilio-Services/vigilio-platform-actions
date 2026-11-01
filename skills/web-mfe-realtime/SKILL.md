---
name: web-mfe-realtime
description: Implementa y revisa WebSocket, Socket.IO client y SSE en web MFE. Usar para conexiones, listeners, reconexión, cache, estados de conexión, accesibilidad y modo degradado.
owner: frontend-platform
lifecycle: stable
introduced_in: 0.7.0
routing_ecosystems: "web, frontend, react, preact, typescript"
routing_keywords: "sse, websocket, tanstack-query"
routing_files: "package.json, vite.config.ts"
routing_capabilities: "realtime, streaming"
requires: [web-mfe-technologies]
optional: []
conflicts: []
supersedes: []
---

<skill-content>

# Tiempo Real Web MFE

> Fuente única para **Lectura obligatoria de referencias**: [abrir documento canónico](../.vigilio-docs/governance/documentation-dry-and-ownership.md).


## Flujo

1. Confirma el contrato publicado por el backend.
2. Elige SSE o Socket.IO según la dirección.
3. Encapsula transporte dentro de `services/`.
4. Encapsula ciclo de vida dentro de hooks.
5. Crea una conexión por sesión y propósito.
6. Cierra listeners durante cleanup y logout.
7. Deduplica eventos mediante identificadores estables.
8. Actualiza TanStack Query sin duplicar server state.
9. Implementa backoff, límites y modo degradado.
10. Prueba accesibilidad, reconexión y cleanup.

## Estructura

- Coloca tipos propios en `types/` dentro de la feature.
- Coloca eventos y límites en `constants/` dentro de la feature.
- Reutiliza tipos contractuales publicados.
- Evita tipos y constantes arriba de componentes, hooks o services.
- Mantén tipos inferidos junto al schema propietario.

## Límites

- No conectes durante render.
- No agregues listeners sin cleanup.
- No coloques tokens en URLs.
- No copies eventos del backend.
- No guardes server state duplicado.

## Respuesta

Resume primero el comportamiento visible.

Usa frases cortas.

Incluye estados, riesgos, pruebas y ejemplos aplicables.


> Fuente única para **Correcto / Incorrecto: manejo de existente**: [abrir documento canónico](../.vigilio-docs/standards/engineering/refactoring-existing-code.md).

## ✅ Correcto / ❌ Incorrecto — tarea `web-mfe-realtime`

✅ **Correcto:** en esta tarea, aplicar criterios verificables específicos de esta guía y consultar su owner canónico; remitir la norma compartida al documento propietario.

❌ **Incorrecto:** en esta tarea, copiar reglas de otro stack o declarar evidencia sin haberla ejecutado; inventar pruebas o pegar el mismo procedimiento transversal en varias skills.

## Guías de librerías por versión — lectura antes de usar sus APIs

Las versiones de esta skill no se copian aquí: comprobar lockfile y [versión canónica](../.vigilio-docs/technology/versions.md). Cuando la tarea utilice una de estas dependencias, **abrir el `.md` completo** y consultar su migración ✅/❌ antes de escribir código; el resto no es obligatorio para una tarea que no la utiliza.
- [socket-io](../.vigilio-docs/technology/libraries/socket-io.md)

✅ Correcto: versionar el consumidor y seguir los ejemplos de la API instalada; enlazar documento propietario.  ❌ Incorrecto: copiar APIs legacy, duplicar normas en la skill o instalar nuevas dependencias sin gate.

