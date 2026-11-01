---
name: node-nest-realtime
description: Diseña, implementa y revisa WebSocket, Socket.IO y SSE en backends Node/Nest. Usar para gateways, eventos, rooms, autenticación, reconexión, adapters compartidos, escalamiento y entrega unidireccional.
owner: backend-platform
lifecycle: stable
introduced_in: 0.7.0
routing_ecosystems: "node, nestjs, typescript"
routing_keywords: "websockets, socketio, sse, realtime"
routing_files: "package.json, tsconfig.json"
routing_capabilities: "realtime, streaming"
requires: [node-nest-technologies]
optional: []
conflicts: []
supersedes: []
---

<skill-content>

# Tiempo Real Node/Nest

> Fuente única para **Navegación canónica multistack 2026**: [abrir documento canónico](../.vigilio-docs/stacks/backend/nestjs/README.md).


## Lectura obligatoria de referencias

Lee completamente [references/realtime-patterns.md](references/realtime-patterns.md).

Abre cada fuente canónica aplicable.

No cierres gates cuando una fuente requerida resulte inaccesible.

## Flujo

1. Confirma si HTTP resuelve el caso.
2. Elige SSE para flujo unidireccional.
3. Elige Socket.IO para comunicación bidireccional administrada.
4. Define eventos versionados y schemas Zod.
5. Autentica el handshake.
6. Autoriza cada room y evento.
7. Implementa límites, backpressure y deduplicación.
8. Configura adapter, readiness y drenado.
9. Instrumenta conexiones, errores y latencia.
10. Prueba reconexión, escalamiento y seguridad negativa.

## Estructura

- Coloca tipos propios en `types/` dentro de la feature.
- Coloca eventos y límites en `constants/` dentro de la feature.
- Mantén schemas y DTOs junto a sus contratos.
- Evita tipos y constantes arriba de gateways, controllers o services.
- Evita carpetas globales cuando el uso pertenece a una feature.

## Límites

- No uses tiempo real como cola durable.
- No confíes en rooms solicitadas por clientes.
- No envíes tokens mediante query strings.
- No emitas payloads sin validar.
- No fuerces afinidad cuando el adapter elimina esa necesidad.

## Respuesta

Resume primero el transporte elegido.

Usa frases cortas.

Incluye riesgos, pruebas y ejemplos aplicables.


> Fuente única para **Correcto / Incorrecto: manejo de existente**: [abrir documento canónico](../.vigilio-docs/standards/engineering/refactoring-existing-code.md).

## ✅ Correcto / ❌ Incorrecto — tarea `node-nest-realtime`

✅ **Correcto:** en esta tarea, aplicar criterios verificables específicos de esta guía y consultar su owner canónico; remitir la norma compartida al documento propietario.

❌ **Incorrecto:** en esta tarea, copiar reglas de otro stack o declarar evidencia sin haberla ejecutado; inventar pruebas o pegar el mismo procedimiento transversal en varias skills.

## Guías de librerías por versión — lectura antes de usar sus APIs

Las versiones de esta skill no se copian aquí: comprobar lockfile y [versión canónica](../.vigilio-docs/technology/versions.md). Cuando la tarea utilice una de estas dependencias, **abrir el `.md` completo** y consultar su migración ✅/❌ antes de escribir código; el resto no es obligatorio para una tarea que no la utiliza.
- [socket-io](../.vigilio-docs/technology/libraries/socket-io.md)

✅ Correcto: versionar el consumidor y seguir los ejemplos de la API instalada; enlazar documento propietario.  ❌ Incorrecto: copiar APIs legacy, duplicar normas en la skill o instalar nuevas dependencias sin gate.

