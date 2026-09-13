---
name: node-nest-realtime
description: Diseña, implementa y revisa WebSocket, Socket.IO y SSE en backends Node/Nest. Usar para gateways, eventos, rooms, autenticación, reconexión, adapters compartidos, escalamiento y entrega unidireccional.
---

<skill-content>

# Tiempo Real Node/Nest

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

</skill-content>
