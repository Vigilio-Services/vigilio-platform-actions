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
|   |-- dtos/
|   |-- repositories/
|   |-- schemas/
|   `-- service/
|-- infrastructure/
|   |-- http/controllers/
|   `-- persistence/drizzle/
`-- {feature}.module.ts
```

Agregar `domain/` solamente cuando existan value objects, transiciones, invariantes o comportamiento independiente de HTTP y DB.

## Descubrimiento Del Proyecto

1. Leer `AGENTS.md` y `openspec/config.yaml` cuando existan.
2. Buscar un modulo con `application/`, `infrastructure/` y `{feature}.module.ts`.
3. Confirmar sus convenciones contra tests y configuración ejecutable.
4. Tratar los documentos centrales como baseline, no como sustituto del código del consumidor.

## Definition Of Done

- Entrada, salida y errores tienen contrato Zod.
- El response no expone columnas internas ni secretos.
- El service depende de ports y mantiene invariantes.
- DB tiene constraints equivalentes a invariantes criticas.
- AuthN/AuthZ es explicita y private-by-default.
- OpenAPI refleja seguridad, request, response y errores.
- Unit, integration y E2E se agregan segun el riesgo.
- Pasan `pnpm lint`, `pnpm typecheck`, `pnpm test:coverage` y `pnpm openapi:diff`.
