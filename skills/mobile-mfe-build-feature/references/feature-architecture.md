# Arquitectura De Feature Mobile

## Flujo vertical

```text
app route -> screen -> feature hook/component -> service -> validated contract -> backend
                         |                  |
                         |                  +-> native adapter when required
                         +-> TanStack Query / React Hook Form
```

Keep `app/` declarative. A route may select a screen and navigation metadata; business orchestration belongs below it.

## Feature layers

```text
app/(app)/products.tsx
  -> src/screens/products-screen.tsx
    -> src/features/products/components/products-index.tsx
      -> src/features/products/hooks/use-products-index-query.ts
        -> src/features/products/services/products-index.api.ts
          -> src/services/http/api.ts + published contract
```

- Use one recognizable HTTP operation per `*.api.ts`; do not group the CRUD surface in `product.service.ts`.
- Hooks own query keys, cache, retry and invalidation; they do not call `fetch` directly.
- Components own native presentation and interaction; they do not parse responses.
- `types/` contains only UI projections derived from the published contract.
- `schemas/` exists only for native form representation, never as a backend-contract mirror.
- Keep tests adjacent to APIs, hooks, components, mappers and runtime constants.
- Create a folder only when it contains a real responsibility and file.

## Ownership de estado

| State | Owner |
| --- | --- |
| Backend response and cache | TanStack Query |
| Input, validation, submission | React Hook Form + Zod |
| Route params and tab/stack position | Expo Router |
| Session projection or small shared UI signal | Preact Signals |
| Secret token | Expo SecureStore behind an adapter |
| Temporary modal/pressed state | `useSignal` (from `@preact/signals-react`) |

Never mirror one owner into another. Derive display values at render time or with memoized selectors.

## Native lifecycle

- Connect Query focus to `AppState` only while active.
- Connect online state to NetInfo.
- Cancel or ignore stale async work during unmount/navigation.
- Request permissions at the moment of use and explain denial.
- Use DocumentPicker/FileSystem URIs; do not assume browser `File` or filesystem paths.
- Respect safe areas, keyboards, font scaling, reduced motion, and platform back behavior.

## Reuse threshold

Keep feature-specific code in the feature. Promote a primitive only after two real consumers with the same semantics exist. A shared directory is not a dumping ground.
