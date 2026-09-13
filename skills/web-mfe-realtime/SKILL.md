---
name: web-mfe-realtime
description: Implementa y revisa WebSocket, Socket.IO client y SSE en web MFE. Usar para conexiones, listeners, reconexión, cache, estados de conexión, accesibilidad y modo degradado.
---

<skill-content>

# Tiempo Real Web MFE

## Lectura obligatoria de referencias

Lee completamente [references/realtime-patterns.md](references/realtime-patterns.md).

Abre cada fuente canónica aplicable.

No cierres gates cuando una fuente requerida resulte inaccesible.

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

</skill-content>
