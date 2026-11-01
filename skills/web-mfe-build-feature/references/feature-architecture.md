# Arquitectura De Feature Frontend

## Fuentes Canónicas

| Necesidad | Fuente canónica |
|---|---|
| Arquitectura, capas y estado | [vigilio-docs/3-arquitectura-estructura-estado](../../.vigilio-docs/stacks/frontend/web-mfe/architecture/3-arquitectura-estructura-estado.md) |
| BFF, HTTP y autenticación | [vigilio-docs/5-bff-http-runtime-auth](../../.vigilio-docs/stacks/frontend/web-mfe/http/5-bff-http-runtime-auth.md) |
| Golden path de feature | [vigilio-docs/6-golden-path-feature](../../.vigilio-docs/stacks/frontend/web-mfe/features/6-golden-path-feature-componentes-hooks.md) |
| Calidad, SEO y accesibilidad | [vigilio-docs/8-calidad-seo-accesibilidad-rendimiento](../../.vigilio-docs/stacks/frontend/web-mfe/quality/8-calidad-seo-accesibilidad-rendimiento.md) |
| Convención ejecutable | feature vecina equivalente dentro del consumidor |

Tratar los documentos centrales como baseline y el código/tests del consumidor como evidencia vigente. Si difieren, verificar el comportamiento antes de editar.

## Flujo de dependencias

```text
route/app shell
  -> feature container
    -> query/mutation hooks
      -> services HTTP
        -> api client + Zod response schema
    -> presentational components
      -> libs/ui primitives
```

Las dependencias apuntan hacia servicios y primitivas. `libs/ui` no conoce features, endpoints ni DTOs de negocio.

## Seleccion de estado

| Estado | Herramienta | Regla |
|---|---|---|
| Datos remotos y cache | TanStack Query | No duplicar en Zustand/signals |
| Formulario y errores de campo | React Hook Form | Resolver Zod desde request DTO |
| Estado visual local | `useSignal` (Preact Signals) | Mantenerlo cerca del consumidor |
| Preferencia compartida cliente | signal/Zustand | Solo si cruza features o rutas |
| URL, filtros compartibles | router/query string | La URL es la fuente de verdad |

## Estados obligatorios

Toda superficie async debe decidir explicitamente:

- loading inicial;
- refresh en segundo plano;
- empty state;
- error recuperable;
- error no recuperable mediante boundary;
- success y feedback de mutation;
- permisos insuficientes o sesion expirada.

## Componentes reutilizables

Promover a `libs/ui` solo cuando:

1. existen al menos dos consumidores reales;
2. la API no contiene nombres del dominio;
3. no importa servicios, stores ni contratos HTTP;
4. soporta teclado, focus y estados disabled/error;
5. tiene prueba de comportamiento si contiene logica.

No promover containers, paneles completos ni tablas atadas a un response concreto.

## Tipos Y Constantes

✅ Correcto:```ts
// features/chat/types/chat-state.type.ts
export type ChatState = 'connecting' | 'connected' | 'degraded';

// features/chat/constants/chat-events.constant.ts
export const CHAT_MESSAGE_EVENT = 'chat.message.created.v1';
```

❌ Incorrecto:```tsx
type ChatState = string;
const EVENT = 'message';
export function ChatPanel() {}
```

Mantén props exclusivas junto al componente.

Evita carpetas `types/` globales y barrels masivos.

## Query keys

Usar factories pequenas cuando una feature tiene multiples operaciones:

```ts
export const product_keys = {
  all: ['products'] as const,
  list: (filters: ProductFilters) => [...product_keys.all, 'list', filters] as const,
  detail: (id: number) => [...product_keys.all, 'detail', id] as const,
};
```

La key debe incluir todo valor que cambie el resultado. Evitar objetos mutables o datos no serializables.

## Anti-patrones

- `useEffect` para reemplazar TanStack Query.
- Copiar server state a un store global.
- Llamar `fetch`/Amplify directamente desde componentes.
- Componentes genericos con decenas de flags.
- Un hook por cada linea de logica.
- Index barrels que generan ciclos.
- Ocultar errores con fallback silencioso.

## ✅ Correcto / ❌ Incorrecto: manejo de existente

- ✅ **Correcto:** Componentes enfocados, contratos compartidos, estados explícitos, accesibilidad y `map()` puro para renderizar listas con keys estables.
- ❌ **Incorrecto:** `map()` para efectos ignorando el retorno, `forEach(async...)` sin esperar, duplicar schemas y renderizar HTML no confiable.
- **Gate:** no reescribir masivamente código heredado; inspeccionar baseline, tests y locks reales; reportar `NOT_RUN` si falta evidencia. La guía de refactor se consulta en `vigilio-docs/standards/engineering/refactoring-existing-code.md` según la revisión de Docs aprobada (no asumir que el link remoto `main` ya esté publicado).
