# Patrones De Feature Node/Nest

## Fuentes Del Repositorio

| Necesidad | Fuente canonica |
| --- | --- |
| Convenciones generales | [vigilio-docs/5-buenas-practicas](https://github.com/VigilioYonatan/vigilio-docs/blob/main/backend-node-nest/5-buenas-practicas.md) |
| Reglas de codigo | [vigilio-docs/20-reglas-senior-codigo](https://github.com/VigilioYonatan/vigilio-docs/blob/main/backend-node-nest/20-reglas-senior-codigo.md) |
| Feature completa | [vigilio-docs/21-golden-path-feature](https://github.com/VigilioYonatan/vigilio-docs/blob/main/backend-node-nest/21-golden-path-feature.md) |
| DTO request/response | [vigilio-docs/27-dtos-request-response](https://github.com/VigilioYonatan/vigilio-docs/blob/main/backend-node-nest/27-dtos-request-response.md) |
| Convencion ejecutable | modulo vecino equivalente dentro de `src/` |

## Estructura Base

```text
src/{feature}/
|-- application/
|   |-- constants/
|   |-- dtos/
|   |-- repositories/
|   |-- schemas/
|   |-- types/
|   `-- services/
|-- infrastructure/
|   |-- http/controllers/
|   `-- persistence/drizzle/
`-- {feature}.module.ts
```

Agregar `domain/` solamente cuando existan value objects, transiciones, invariantes o comportamiento independiente de HTTP y DB.

## Tipos Y Constantes

Bien:

```ts
// application/types/product-filter.type.ts
export type ProductFilter = { status?: ProductStatus };

// application/constants/product-limit.constant.ts
export const PRODUCT_PAGE_LIMIT = 100;
```

Mal:

```ts
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

## OpenAPI Con Decoradores NestJS Y Zod

Aplicar este perfil cuando el OpenAPI se genere desde código. Si `bus-dsg`, `ch-dsg` u otro repositorio
contract-first es el owner, conservar su YAML como fuente canónica y validar que el documento exportado
por NestJS sea compatible; los decoradores no reemplazan un contrato externo aprobado.

### Casos De Uso

Documentar el comportamiento real, no el nombre técnico de la clase:

| Caso de uso | `summary` | `📦 Proceso` | `🔧 Funcionalidad` |
| --- | --- | --- | --- |
| comando con body | acción breve, por ejemplo `Registrar Endoso RRLL` | actividad de negocio, por ejemplo `Registrar Endoso` | resultado observable del servicio |
| consulta | verbo y recurso consultado | consulta de negocio ejecutada | información que devuelve y para qué sirve |
| actualización parcial | cambio de negocio permitido | actualización aplicada | efecto observable y límites relevantes |
| eliminación o anulación | acción exacta del dominio | eliminación o anulación real | resultado, reversibilidad y restricciones |

No reutilizar el texto de registro en consultas, actualizaciones o anulaciones. Mantener `operationId`
camelCase, único y estable, alineado con el caso de uso. El status exitoso, errores, headers y seguridad
deben coincidir con el runtime y no con una plantilla genérica.

### Ejemplo RRLL Resumido Pero Completo

```ts
@ApiTags("Endosos RRLL")
@Controller("endosos")
export class EndosoController {
  constructor(private readonly service: EndosoApplicationService) {}

  @Post()
  @ApiOperation({
    summary: "Registrar Endoso RRLL",
    operationId: "crearEndoso",
    description: [
      "📦 Proceso: Registrar Endoso",
      "",
      "🔧 Funcionalidad: Servicio que permite registrar endosos RRLL.",
    ].join("\n"),
  })
  @ApiHeader({
    name: "TraceId",
    required: true,
    description: "Identificador de trazabilidad de la solicitud.",
  })
  @ApiSecurity("sigv4")
  @ApiBody({ type: RegistrarEndosoRequestDocDto })
  @ApiValidationErrorResponse()
  @ApiUnexpectedErrorResponse()
  @ZodResponse({
    status: 200,
    description: "Endoso registrado correctamente.",
    type: RegistrarEndosoResponseDocDto,
  })
  crearEndoso(
    @Body(new ZodPipe(registrarEndosoRequestDto)) body: RegistrarEndosoRequestDto,
  ): Promise<RegistrarEndosoResponseDto> {
    return this.service.crearEndoso(body);
  }
}
```

El DTO de documentación reutiliza el schema runtime; no se reescriben campos para Swagger:

```ts
export class RegistrarEndosoRequestDocDto extends createZodDto(registrarEndosoRequestDto) {}
export class RegistrarEndosoResponseDocDto extends createZodDto(registrarEndosoResponseDto) {}
```

Reglas de integración:

- usar `@ApiBearerAuth()` si el proyecto realmente usa bearer; usar `@ApiSecurity("sigv4")` solo cuando
  `sigv4` esté registrado en `DocumentBuilder` y sea aplicado por el runtime;
- preferir decoradores compartidos para `TraceId` y respuestas de error cuando ya existan;
- declarar `@ApiParam`, `@ApiQuery`, `@ApiConsumes` y el status correspondiente solo en casos que los
  necesiten;
- ejecutar `cleanupOpenApiDoc` sobre el documento generado cuando la versión instalada de
  `nestjs-zod` lo requiera, y después ejecutar lint, export/bundle y diff del contrato;
- aceptar referencias internas como `#/components/schemas/...` en code-first; si se exige conservar
  `$ref` relativos a archivos físicos, mantener el flujo contract-first;
- no documentar `200`, `400`, `500`, `TraceId` o `sigv4` si el endpoint no los implementa realmente.

## Definition Of Done

- Entrada, salida y errores tienen contrato Zod.
- El response no expone columnas internas ni secretos.
- El service depende de ports y mantiene invariantes.
- DB tiene constraints equivalentes a invariantes criticas.
- AuthN/AuthZ es explicita y private-by-default.
- OpenAPI refleja seguridad, request, response y errores.
- La matriz contrato-runtime no contiene drift entre owner, implementación y consumidor.
- Unit, integration y E2E se agregan segun el riesgo.
- Pasan `pnpm lint`, `pnpm typecheck`, `pnpm test:coverage` y `pnpm openapi:diff`.
