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

> **Nota de Gobernanza:** En la gran mayoría de los casos **NO SE CREARÁ** un schema local de formulario manual como `const productStoreFormSchema = z.object({ ... })`. Se consume directamente el `requestDto` publicado desde el paquete de contratos del proyecto (ej. `@vigilioyonatan/bus-contracts` — *el nombre del paquete variará según el proyecto*). Únicamente en situaciones excepcionales de UI complejas se requerirá un schema local intermedio.

```ts
import { zodResolver } from '@hookform/resolvers/zod';
import {
  productStoreRequestDto,
  type ProductStoreRequestDto,
} from '@vigilioyonatan/bus-contracts'; // El nombre del paquete de contratos varía según el proyecto
import { useForm } from 'react-hook-form';

// MAYORMENTE SERÁ ASÍ: Consumo directo del contrato DTO publicado
const form = useForm<ProductStoreRequestDto>({
  resolver: zodResolver(productStoreRequestDto),
  defaultValues: {
    name: '',
    description: null,
  },
});
```

Los `defaultValues` deben respetar `nullable`, `optional` y coerciones del contrato. No convertir `null` a `undefined` sin una regla de UI explicita.

## Servicio HTTP

```ts
import {
  productIndexResponseDto,
  type ProductIndexResponseDto,
} from '@vigilioyonatan/bus-contracts';

export function listProducts(): Promise<ProductIndexResponseDto> {
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
  queryFn: () => listProducts(filters),
  staleTime: 30_000,
});
```

No seleccionar campos antes del parse. `select` puede transformar un response ya validado para una vista.

## Mutation

```ts
const createProduct = useMutation({
  mutationFn: (input: ProductStoreRequestDto) => storeProduct(input),
  onSuccess: async () => {
    await queryClient.invalidateQueries({ queryKey: productKeys.all });
  },
});
```

Usar optimistic update solo cuando existe rollback determinista y el beneficio UX lo justifica.

## TanStack Table

```ts
type ProductRow = ProductIndexResponseDto['results'][number];

const columns: ColumnDef<ProductRow>[] = [
  { accessorKey: 'name', header: 'Producto' },
  {
    accessorKey: 'price',
    header: 'Precio',
    cell: ({ getValue }) => formatMoney(getValue<string>()),
  },
];
```

El contrato mantiene dinero exacto como `string`; el formatter es responsabilidad de presentacion. No convertir dinero a `number` para conservar precision.

## ViewModel

Crear ViewModel cuando la UI combina o formatea datos:

```ts
interface ProductRowViewModel {
  readonly id: number;
  readonly displayName: string;
  readonly formattedPrice: string;
}
```

El nombre `ViewModel` deja claro que no es otro DTO HTTP. Mantener la funcion de mapping pura y probada si contiene reglas.

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
