# Patrones De Contratos Frontend

## Fuentes Canónicas

| Necesidad | Fuente canónica |
|---|---|
| DTOs, Zod, forms y TanStack | [vigilio-docs/1-contratos-dtos-zod-tanstack](../../.vigilio-docs/stacks/frontend/web-mfe/contracts/1-contratos-dtos-zod-tanstack.md) |
| BFF, ApiClient, errores y auth | [vigilio-docs/5-bff-http-runtime-auth](../../.vigilio-docs/stacks/frontend/web-mfe/http/5-bff-http-runtime-auth.md) |
| Feature completa | [vigilio-docs/6-golden-path-feature](../../.vigilio-docs/stacks/frontend/web-mfe/features/6-golden-path-feature-componentes-hooks.md) |
| Pruebas de contrato | [vigilio-docs/7-testing-vitest-msw-playwright](../../.vigilio-docs/stacks/frontend/web-mfe/testing/7-testing-vitest-msw-playwright.md) |
| Contrato ejecutable | Package exacto del perfil instalado por el consumidor |

| Perfil | Owner | Package | Consumer |
|---|---|---|---|
| `current-web` | `bus-impl` | `@vigilioyonatan/bus-contracts` | `web-mfe` |
| `k8s-v2` | `bus-impl-v2` | `@vigilioyonatan/bus-v2-contracts` | `web-mfe-v2` |

No sustituir el paquete publicado ni el OpenAPI por snippets documentales. Confirmar nombres y tipos contra la versión instalada.

## React Hook Form

> **Nota de Gobernanza:** En la gran mayoría de los casos **NO SE CREARÁ** un schema local de formulario manual como `const registerProductFormSchema = z.object({ ... })`. Se consume directamente el `requestDto` publicado desde el package resuelto por perfil. Únicamente en situaciones excepcionales de UI complejas se requerirá un schema local intermedio.

```ts
import { zodResolver } from '@hookform/resolvers/zod';
import {
  registerProductRequestDto,
  type RegisterProductRequestDto,
} from '@vigilioyonatan/bus-v2-contracts'; // Perfil k8s-v2; current-web usa bus-contracts
import { useForm } from 'react-hook-form';

// MAYORMENTE SERÁ ASÍ: Consumo directo del contrato DTO publicado
const form = useForm<RegisterProductRequestDto>({
  resolver: zodResolver(registerProductRequestDto),
  defaultValues: {
    name: '',
    description: null,
  },
});
```

Los `defaultValues` deben respetar `nullable`, `optional` y coerciones del contrato. No convertir `null` a `undefined` sin una regla de UI explicita.

## Servicio HTTP

```ts
import type { ListProductsResponseDto } from '@vigilioyonatan/bus-v2-contracts'; // Perfil k8s-v2; current-web usa bus-contracts

export function listProducts(): Promise<ListProductsResponseDto> {
  return apiClient.get<ListProductsResponseDto>('/products');
}
```

En API first-party controlada, el generic tipa sin validar runtime. Si el cliente recibe
terceros/datos de riesgo, pasar el schema publicado como opcion explicita y validar solo en el
borde. Nunca afirmar que `as ResponseDto` valida JSON. Registrar nombre de operacion, correlation ID y tipo de fallo; nunca payload completo o PII.

## TanStack Query

```ts
const products_query = useQuery({
  queryKey: product_keys.list(filters),
  queryFn: () => listProducts(filters),
  staleTime: 30_000,
});
```

No duplicar proyecciones del contrato. `select` transforma un response tipado; si el boundary activa parse runtime, validar antes de exponerlo.

## Mutation

```ts
const query_client = useQueryClient();
const register_product_mutation = useMutation({
  mutationFn: (input: RegisterProductRequestDto) => registerProductApi(input),
  onSuccess: async () => {
    await query_client.invalidateQueries({ queryKey: product_keys.all });
  },
});
```

Usar optimistic update solo cuando existe rollback determinista y el beneficio UX lo justifica.

## TanStack Table

```ts
type ProductRow = ListProductsResponseDto['results'][number];

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

## ✅ Correcto / ❌ Incorrecto: manejo de existente

- ✅ **Correcto:** Componentes enfocados, contratos compartidos, estados explícitos, accesibilidad y `map()` puro para renderizar listas con keys estables.
- ❌ **Incorrecto:** `map()` para efectos ignorando el retorno, `forEach(async...)` sin esperar, duplicar schemas y renderizar HTML no confiable.
- **Gate:** no reescribir masivamente código heredado; inspeccionar baseline, tests y locks reales; reportar `NOT_RUN` si falta evidencia. La guía de refactor se consulta en `vigilio-docs/standards/engineering/refactoring-existing-code.md` según la revisión de Docs aprobada (no asumir que el link remoto `main` ya esté publicado).


**Frontera HTTP vigente:** usar la norma canónica `standards/api/http-dtos-and-contracts.md` del snapshot Vigilio. Entradas y salidas HTTP declaran Zod y el tipo inferido en el mismo `*.dto.ts`; entidades usan `domain/schemas/*.schema.ts`; SQL usa ORM/migrations. En Laravel emplear FormRequest o Spatie Data sin duplicación; web/mobile importan solo contratos browser-safe y no `*.doc.ts`. Los exports publicados se migran con compatibilidad y pruebas.
