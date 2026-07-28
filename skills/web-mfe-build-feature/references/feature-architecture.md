# Arquitectura De Feature Frontend

## Fuentes Canónicas

| Necesidad | Fuente canónica |
|---|---|
| Arquitectura, capas y estado | [vigilio-docs/3-arquitectura-estructura-estado](https://github.com/VigilioYonatan/vigilio-docs/blob/main/frontend-web-mfe/3-arquitectura-estructura-estado.md) |
| BFF, HTTP y autenticación | [vigilio-docs/5-bff-http-runtime-auth](https://github.com/VigilioYonatan/vigilio-docs/blob/main/frontend-web-mfe/5-bff-http-runtime-auth.md) |
| Golden path de feature | [vigilio-docs/6-golden-path-feature](https://github.com/VigilioYonatan/vigilio-docs/blob/main/frontend-web-mfe/6-golden-path-feature-componentes-hooks.md) |
| Calidad, SEO y accesibilidad | [vigilio-docs/8-calidad-seo-accesibilidad-rendimiento](https://github.com/VigilioYonatan/vigilio-docs/blob/main/frontend-web-mfe/8-calidad-seo-accesibilidad-rendimiento.md) |
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

## Aplicaciones y features

`apps/salud/backoffice` es un ejemplo, no una ruta fija. Usar:

```text
apps/{dominio-o-producto}/{aplicacion}/src/
```

El nombre depende del proyecto: `apps/invoices/admin`, `apps/orders/portal` o `apps/claims/operations` son igualmente validos. Crear otra aplicacion solo cuando exista build, despliegue u ownership independiente.

Una feature simple mantiene todas sus capas juntas, incluidas sus APIs de dominio:

```text
features/products/
|-- pages/
|-- components/
|   `-- ui/
|-- hooks/
|-- services/
|-- constants/
|-- types/
|-- libs/
`-- mocks/
```

Si `products`, `categories` y `brands` son capacidades hermanas, no crear
`features/products/products/`. Usar un padre agregador real:

```text
features/catalog/
|-- products/
|   |-- pages/
|   |-- components/
|   |-- hooks/
|   |-- services/
|   |-- constants/
|   |-- types/
|   |-- libs/
|   `-- mocks/
|-- categories/
|   |-- pages/
|   |-- components/
|   |-- hooks/
|   |-- services/
|   |-- constants/
|   |-- types/
|   |-- libs/
|   `-- mocks/
|-- brands/
|   |-- pages/
|   |-- components/
|   |-- hooks/
|   |-- services/
|   |-- constants/
|   |-- types/
|   |-- libs/
|   `-- mocks/
`-- shared/
```

No crear el árbol completo por plantilla. Cada carpeta debe contener archivos y una responsabilidad
real. `{feature}/shared/` exige dos consumidoras hermanas; `src/shared/` exige dos features de primer
nivel; `libs/ui` exige UI agnóstica reutilizada entre aplicaciones.

Las APIs viven en `features/{feature}/services/{operacion}.api.ts`; los hooks hermanos importan esas
funciones y configuran TanStack Query. `src/services/` conserva infraestructura transversal. Los
componentes no ejecutan `fetch` ni importan el cliente HTTP.

```text
features/users/pages/users-index.tsx
  -> features/users/hooks/users-index.hooks.ts
    -> features/users/services/users-index.api.ts
      -> GET /users

features/users/components/users-store.tsx
  -> features/users/hooks/users-store.hooks.ts
    -> features/users/services/users-store.api.ts
      -> POST /users
        -> invalidar users-index
```

## Convencion de nombres y tests

- **APIs HTTP en `services/`**: Cada operación debe tener su propio archivo en kebab-case (`product-index.api.ts`, `product-store.api.ts`, `product-update.api.ts`, `product-destroy.api.ts`). Prohibido agrupar múltiples endpoints en archivos monolíticos como `product.service.ts`.
- **Custom Hooks en `hooks/`**: Cada hook debe usar kebab-case indicando acción y tipo (`use-product-index-query.ts`, `use-product-store-mutation.ts`). Prohibido camelCase como `useProductIndex.ts`.

Ejemplo de estructura de archivos adyacentes:

```text
features/users/components/users-store.tsx
features/users/components/users-store.test.tsx
features/users/components/users-update.tsx
features/users/components/users-update.test.tsx
features/users/hooks/use-users-index-query.ts
features/users/hooks/use-users-index-query.test.ts
features/users/hooks/use-users-store-mutation.ts
features/users/hooks/use-users-store-mutation.test.ts
features/users/constants/users-query-keys.constants.ts
features/users/constants/users-query-keys.constants.test.ts
features/users/services/users-index.api.ts
features/users/services/users-index.api.test.ts
features/users/services/users-store.api.ts
features/users/services/users-store.api.test.ts
```

Evitar `form.tsx`, `panel.tsx`, `utils.ts` o `hooks.ts` sin contexto. Todo `.ts`/`.tsx` escrito a mano que genere JavaScript tiene cobertura identificable y, por defecto, prueba adyacente con el mismo nombre base. Esto incluye constantes runtime y query-key factories. `*.types.ts`, `.d.ts`, CSS y codigo generado se validan mediante sus gates y no pueden contener logica oculta.

## Seleccion de estado

| Estado | Herramienta | Regla |
|---|---|---|
| Datos remotos y cache | TanStack Query | No duplicar en Zustand/signals |
| Formulario y errores de campo | React Hook Form | Resolver Zod desde request DTO |
| Estado visual local reactivo | `useSignal` local | Default para nuevo código Preact; mantenerlo cerca del consumidor |
| Valor derivado de Signals | `useComputed` | No duplicar ni sincronizar manualmente |
| Preferencia compartida cliente | signal con owner; Zustand excepcional | Solo si cruza features/rutas y tiene lifecycle/reset |
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

## Query keys

Usar factories pequenas cuando una feature tiene multiples operaciones:

```ts
export const productKeys = {
  all: ['products'] as const,
  list: (filters: ProductFilters) => [...productKeys.all, 'list', filters] as const,
  detail: (id: number) => [...productKeys.all, 'detail', id] as const,
};
```

La key debe incluir todo valor que cambie el resultado. Evitar objetos mutables o datos no serializables.

## Anti-patrones

- Introducir `useState` por costumbre cuando un Signal local ofrece ownership y actualización más simples.
- Crear signals globales sin owner, lifecycle, reset de tests o consumidores reales.
- Mutar arrays/objetos dentro de `.value` sin reemplazar la referencia.
- Copiar server state, formularios, URL o runtime config dentro de Signals.
- `useEffect` para reemplazar TanStack Query.
- Copiar server state a un store global.
- Llamar `fetch`/Amplify directamente desde componentes.
- Componentes genericos con decenas de flags.
- Un hook por cada linea de logica.
- Index barrels que generan ciclos.
- Ocultar errores con fallback silencioso.
