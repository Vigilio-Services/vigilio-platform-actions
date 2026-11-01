---
name: node-nest-async-workers
description: Diseña, implementa y revisa workers Node/Nest con outbox, SNS, SQS y DLQ. Usar para publicación transaccional, idempotencia, concurrencia, visibility timeout, retries, poison messages, replay y escalamiento.
owner: backend-platform
lifecycle: stable
introduced_in: 0.7.0
routing_ecosystems: "node, nestjs, typescript"
routing_keywords: "sqs, sns, outbox, workers, eventbridge"
routing_files: "package.json, tsconfig.json"
routing_capabilities: "messaging, async, workers"
requires: [node-nest-technologies]
optional: []
conflicts: []
supersedes: []
---

<skill-content>

# Workers Asíncronos Node/Nest

> Fuente única para **Navegación canónica multistack 2026**: [abrir documento canónico](../.vigilio-docs/stacks/backend/nestjs/README.md).


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


## ✅ Correcto / ❌ Incorrecto: manejo de existente

- ✅ **Correcto:** Jobs idempotentes, reintentos acotados, DLQ y outbox tras commit cuando importa la entrega fiable.
- ❌ **Incorrecto:** Emitir a la cola dentro de la transacción y asumir atomicidad DB/broker; lanzar trabajo ilimitado en `map(async...)`.
- **Gate:** no reescribir masivamente código heredado; inspeccionar baseline, tests y locks reales; reportar `NOT_RUN` si falta evidencia. La guía de refactor se consulta en `vigilio-docs/standards/engineering/refactoring-existing-code.md` según la revisión de Docs aprobada (no asumir que el link remoto `main` ya esté publicado).

</skill-content>



## Alineación vigente Vigilio — 2026

- Fuente de verdad: [Event envelopes y outbox](../.vigilio-docs/stacks/backend/nestjs/messaging/event-envelopes.md). Leerla **antes** de crear/refactorizar contratos y justificar cualquier excepción por interfaz externa.
- ✅ Métodos de negocio `listProducts`, `getProduct`, `registerProduct`, `approvePolicy`, `cancelOrder`; Domain `approve/cancel/activate`; Repository `findById/save/findByCriteria`. Datos/vars/parámetros/columnas `snake_case`, tipos/clases `PascalCase`, métodos `camelCase`.
- ✅ Zod: `ProductSchema['id']`, `OrderSchema['status']`, tipos internos `Pick`/intersecciones y DTOs derivados de schema; Laravel: enums nativos, Spatie Data para contratos, Eloquent SQL.
- ❌ No imponer `index/show/store/update/destroy` para casos de uso ni `tenantId` para variables propias; no reescribir APIs externas ni borrar ejemplos históricos. Validar SQL, authz, cache y tests por impacto; clasificar `PASS/FAIL/NOT_RUN/BLOCKED`.

## Guías de librerías por versión — lectura antes de usar sus APIs

Las versiones de esta skill no se copian aquí: comprobar lockfile y [versión canónica](../.vigilio-docs/technology/versions.md). Cuando la tarea utilice una de estas dependencias, **abrir el `.md` completo** y consultar su migración ✅/❌ antes de escribir código; el resto no es obligatorio para una tarea que no la utiliza.
- [bullmq](../.vigilio-docs/technology/libraries/bullmq.md)
- [valkey](../.vigilio-docs/technology/libraries/valkey.md)

✅ Correcto: versionar el consumidor y seguir los ejemplos de la API instalada; enlazar documento propietario.  ❌ Incorrecto: copiar APIs legacy, duplicar normas en la skill o instalar nuevas dependencias sin gate.

