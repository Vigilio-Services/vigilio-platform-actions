# Patrones De Contratos Frontend

## Fuentes Canónicas

| Necesidad | Fuente canónica |
|---|---|
| DTOs, Zod, forms y TanStack | [vigilio-docs/1-contratos-dtos-zod-tanstack](https://github.com/VigilioYonatan/vigilio-docs/blob/main/frontend-web-mfe/1-contratos-dtos-zod-tanstack.md) |
| BFF, ApiClient, errores y auth | [vigilio-docs/5-bff-http-runtime-auth](https://github.com/VigilioYonatan/vigilio-docs/blob/main/frontend-web-mfe/5-bff-http-runtime-auth.md) |
| Feature completa | [vigilio-docs/6-golden-path-feature](https://github.com/VigilioYonatan/vigilio-docs/blob/main/frontend-web-mfe/6-golden-path-feature-componentes-hooks.md) |
| Pruebas de contrato | [vigilio-docs/7-testing-vitest-msw-playwright](https://github.com/VigilioYonatan/vigilio-docs/blob/main/frontend-web-mfe/7-testing-vitest-msw-playwright.md) |
| Contrato ejecutable | `@vigilioyonatan/bus-contracts` instalado por el consumidor |

No sustituir el paquete publicado ni el OpenAPI por snippets documentales. Confirmar nombres y tipos contra la versión instalada.

## React Hook Form

Configurar el locale oficial de Zod 4.4 una sola vez antes de cargar schemas o montar la aplicación:

```ts
// services/validation/zod-locale.ts
import { z } from 'zod';

z.config(z.locales.es());
```

Importar este módulo en `main.tsx` y en el setup de Vitest. La configuración es global para la
instancia de Zod: los mensajes built-in pasan a español, mientras que mensajes personalizados del
schema conservan el texto definido por el owner del contrato.

```ts
import {
  productStoreRequestDto,
  type ProductStoreRequestDto,
} from '@vigilioyonatan/bus-contracts';
import { useForm } from 'react-hook-form';
import { nullableZodResolver } from '@/services/forms/nullable-zod-resolver';

const form = useForm<ProductStoreRequestDto>({
  mode: 'onChange',
  reValidateMode: 'onChange',
  resolver: nullableZodResolver(productStoreRequestDto),
});
```

Los valores iniciales son decisión de la pantalla y deben respetar `nullable`, `optional` y
coerciones del contrato. No inventar defaults del backend ni convertir `null` a `undefined` sin una
regla explícita de UI.

`nullableZodResolver` transforma `""` a `null` antes de validar, recorre arrays/objetos planos,
preserva `File`/`Blob`/`Date` y deja los campos requeridos a criterio del schema Zod. El input visual
continúa usando `""`; el resultado normalizado solo cruza el boundary del resolver y aparece en
`handleSubmit`. No usar `z.preprocess` directamente con `useForm` si rompe la inferencia de RHF.

## API HTTP

```ts
import {
  productIndexResponseDto,
  type ProductIndexResponseDto,
} from '@vigilioyonatan/bus-contracts';

// features/products/services/products-index.api.ts
export function productsIndexApi(): Promise<ProductIndexResponseDto> {
  return apiClient.get('/products', {
    responseSchema: productIndexResponseDto,
  });
}
```

El cliente HTTP recibe `unknown`, valida con Zod y solo entonces retorna el tipo confiable. Registrar nombre de operacion, correlation ID y tipo de fallo; nunca payload completo o PII.

## TanStack Query

```ts
const productsQuery = useQuery({
  queryKey: productKeys.list(filters),
  queryFn: () => productsIndexApi(filters),
  staleTime: 30_000,
});
```

No seleccionar campos antes del parse. `select` puede transformar un response ya validado para una vista.

## Mutation

```ts
const createProduct = useMutation({
  mutationFn: (input: ProductStoreRequestDto) => productsStoreApi(input),
  onSuccess: async () => {
    await queryClient.invalidateQueries({ queryKey: productKeys.all });
  },
});
```

Usar optimistic update solo cuando existe rollback determinista y el beneficio UX lo justifica.

## Estructura por operación

```text
features/users/services/users-index.api.ts
features/users/services/users-index.api.test.ts
features/users/hooks/users-index.hooks.ts
features/users/hooks/users-index.hooks.test.tsx
features/users/pages/users-index.tsx
features/users/pages/users-index.test.tsx

features/users/services/users-store.api.ts
features/users/services/users-store.api.test.ts
features/users/hooks/users-store.hooks.ts
features/users/hooks/users-store.hooks.test.tsx
features/users/components/users-store.tsx
features/users/components/users-store.test.tsx
```

`users-index.hooks.ts` importa `usersIndexApi` y usa `useQuery`. `users-store.hooks.ts` importa `usersStoreApi`, usa `useMutation` e invalida las keys de `users-index`. Ningun componente ejecuta HTTP directamente.

## TanStack Table

```ts
type ProductRow = ProductIndexResponseDto['results'][number];

const columns: ColumnDef<ProductRow>[] = [
  { accessorKey: 'nombre', header: 'Producto' },
  {
    accessorKey: 'precio',
    header: 'Precio',
    cell: ({ getValue }) => formatMoney(getValue<string>()),
  },
];
```

El contrato mantiene dinero exacto como `string`; el formatter es responsabilidad de presentacion. No convertir dinero a `number` para conservar precision.

## ViewModel

No crear campos formateados dentro del objeto del backend. Si solo se presenta dinero, formatearlo en
la celda o componente:

```ts
type ProductRow = ProductIndexResponseDto['results'][number];

function formatProductPrice(product: ProductRow): string {
  return formatMoney(product.precio);
}
```

Crear un ViewModel solo para composición real de UI. Usar `Pick`, `Omit`, `Partial`, `Readonly`,
`interface extends` o intersecciones para no repetir campos. Si la forma cruza HTTP, el schema Zod
publicado sigue siendo obligatorio: un utility de TypeScript no valida runtime.

## Errores

Separar:

- error de transporte;
- respuesta HTTP esperada y tipada;
- incompatibilidad Zod/contrato;
- error de autenticacion/autorizacion;
- error inesperado de UI.

Una incompatibilidad contractual debe producir telemetria y una experiencia segura; no mostrar detalles internos de Zod al usuario.

## Verificacion

```bash
pnpm governance:contracts
pnpm typecheck
pnpm test
pnpm build
```

Escanear el bundle para impedir `nestjs-zod`, `@nestjs/` y `node:`.
