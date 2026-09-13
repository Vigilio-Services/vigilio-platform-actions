---
name: node-nest-async-workers
description: Diseña, implementa y revisa workers Node/Nest con outbox, SNS, SQS y DLQ. Usar para publicación transaccional, idempotencia, concurrencia, visibility timeout, retries, poison messages, replay y escalamiento.
---

<skill-content>

# Workers Asíncronos Node/Nest

## Lectura obligatoria de referencias

Lee completamente [references/async-patterns.md](references/async-patterns.md).

Abre cada fuente canónica aplicable.

No cierres gates cuando una fuente requerida resulte inaccesible.

## Flujo

1. Define evento, propietario y versión.
2. Persiste negocio y outbox dentro de una transacción.
3. Publica hacia SNS después del commit.
4. Consume desde SQS mediante procesos separados.
5. Deduplica mediante inbox e identificadores estables.
6. Confirma después del efecto durable.
7. Clasifica errores transitorios y permanentes.
8. Configura retries, visibility timeout y DLQ.
9. Diseña replay limitado y auditado.
10. Mide profundidad, antigüedad, latencia y fallos.

## Estructura

- Coloca tipos de eventos en `types/` dentro del contexto.
- Coloca nombres y límites en `constants/`.
- Mantén handlers sin tipos declarados arriba.
- Mantén DTOs inferidos junto a sus schemas.
- Evita barrels globales y dependencias cruzadas.

## Límites

- No hagas dual writes.
- No asumas entrega exacta una vez.
- No confirmes antes del efecto durable.
- No reintentes errores permanentes indefinidamente.
- No reproduzcas una DLQ sin corregir la causa.

## Respuesta

Resume primero entrega, idempotencia y recuperación.

Usa frases cortas.

Incluye fallos, métricas, pruebas y ejemplos aplicables.

</skill-content>
