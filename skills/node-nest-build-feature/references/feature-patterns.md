# Patrones De Feature Node/Nest

## Fuentes Del Repositorio

| Necesidad | Fuente canonica |
| --- | --- |
| Convenciones generales | [vigilio-docs/5-buenas-practicas](../../.vigilio-docs/stacks/backend/nestjs/quality/references/5-buenas-practicas.md) |
| Reglas de codigo | [vigilio-docs/20-reglas-senior-codigo](../../.vigilio-docs/stacks/backend/nestjs/quality/references/20-reglas-senior-codigo.md) |
| Feature completa | [vigilio-docs/21-golden-path-feature](../../.vigilio-docs/stacks/backend/nestjs/architecture/references/21-golden-path-feature.md) |
| Query Zod + nombres DDD + versiones estables | [vigilio-docs/46-contratos-2026](../../.vigilio-docs/stacks/backend/nestjs/http/references/46-zod-query-ddd-versiones-2026.md) |
| DTO request/response | [vigilio-docs/27-dtos-request-response](../../.vigilio-docs/stacks/backend/nestjs/http/references/27-dtos-request-response.md) |
| Convencion ejecutable | modulo vecino equivalente dentro de `src/` |

## Estructura Base

```text
src/{feature}/
|-- domain/
|   `-- schemas/{feature}.schema.ts     # type FeatureSchema = z.infer<...>
|-- application/
|   |-- ports/
|   |-- types/
|   `-- services/
|-- infrastructure/
|   `-- persistence/drizzle/
|-- presentation/http/
|   |-- dto/
|   |   |-- list-products.query.dto.ts     # Zod + type
|   |   |-- register-product.request.dto.ts
|   |   `-- list-products.response.dto.ts
|   `-- controllers/
`-- {feature}.module.ts
```

Mantener `domain/schemas/` para el modelo propietario aun sin agregado con comportamiento; agregar `domain/entities/` únicamente si hay invariantes/transiciones reales. No crear entidades ceremoniales para un CRUD simple.
✅ **Todo caso de uso propio** debe tener nombre semántico: `listProducts`, `getProduct`, `registerProduct`, `approvePolicy`, `cancelOrder`, `activateSubscription`, `calculatePremium`. ❌ No presentar `index/show/store/update/destroy` como convención recomendada. Mantener un `operationId` publicado solo durante migración compatible; derivar los contratos desde el schema Zod propietario en `*.request.dto.ts`/`*.query.dto.ts` para entradas y `*.response.dto.ts` para salidas, con Zod y tipos unidos en cada `.dto.ts`. [Norma](../../.vigilio-docs/standards/api/http-dtos-and-contracts.md).

**Constructor NestJS:** ✅ `constructor(private readonly productRepository: ProductRepository)` con `this.productRepository`. ❌ `private readonly product_repository`; en cambio, métodos propios reciben `product_id: ProductSchema['id']` (`snake_case`).
El directorio `application/services/` es la convención de nuevos ejemplos. Si el consumidor ya posee `application/service/`, seguir su estructura y migrar solo mediante refactor compatible, sin duplicar carpetas.

## Tipos Y Constantes

✅ Correcto:```ts
// application/types/product-filter.type.ts
export type ProductFilter = { estado?: ProductSchema['estado'] };

// application/constants/product-limit.constant.ts
export const PRODUCT_PAGE_LIMIT = 100;
```

❌ Incorrecto:```ts
type ProductFilter = { status?: string };
const LIMIT = 100;
export class ProductController {}
```

No muevas tipos inferidos lejos del schema propietario.

Evita `types/index.ts` y `constants/index.ts` globales.

## Descubrimiento Del Proyecto

1. Leer `AGENTS.md` y `openspec/config.yaml` cuando existan.
2. Buscar un modulo con `application/`, `infrastructure/` y `{feature}.module.ts`.
3. Confirmar sus convenciones contra tests y configuración ejecutable.
4. Tratar los documentos centrales como baseline, no como sustituto del código del consumidor.

## Definition Of Done

- Entrada HTTP en `*.dto.ts`, salida en `*.response.dto.ts`; `*.dto.ts` reúne objeto Zod y tipo inferido. No hardcodear uniones `OrderStatus`; derivar `OrderSchema['status']`.
- El response no expone columnas internas ni secretos.
- El service depende de ports y mantiene invariantes.
- DB tiene constraints equivalentes a invariantes criticas.
- AuthN/AuthZ es explicita y private-by-default.
- OpenAPI refleja seguridad, request, response y errores.
- Unit, integration y E2E se agregan segun el riesgo.
- Pasan `pnpm lint`, `pnpm typecheck`, `pnpm test:coverage` y `pnpm openapi:diff`.

> Fuente única para **Correcto / Incorrecto: manejo de existente**: [abrir documento canónico](../../.vigilio-docs/standards/engineering/refactoring-existing-code.md).


> Fuente única para **Navegación canónica multistack 2026**: [abrir documento canónico](../../.vigilio-docs/stacks/backend/nestjs/README.md).


