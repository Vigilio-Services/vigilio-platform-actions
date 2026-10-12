# Patrones De Feature Node/Nest

## Fuentes Canonicas

| Fuente | Cuando leerla completa |
| --- | --- |
| [5. Buenas practicas](https://github.com/VigilioYonatan/vigilio-docs/blob/main/backend-node-nest/5-buenas-practicas.md) | toda feature Node/Nest |
| [6. Ejemplos de codigo](https://github.com/VigilioYonatan/vigilio-docs/blob/main/backend-node-nest/6-ejemplos-codigo.md) | ejemplos de implementacion, Swagger/Zod o perfil RRLL |
| [20. Reglas senior](https://github.com/VigilioYonatan/vigilio-docs/blob/main/backend-node-nest/20-reglas-senior-codigo.md) | tipado, services, queries, async o calidad de codigo |
| [21. Golden path](https://github.com/VigilioYonatan/vigilio-docs/blob/main/backend-node-nest/21-golden-path-feature.md) | estructura, nombres o vertical slice |
| [27. DTOs publicos](https://github.com/VigilioYonatan/vigilio-docs/blob/main/backend-node-nest/27-dtos-request-response.md) | request, response o contrato publico |
| [43. Tecnologias backend](https://github.com/VigilioYonatan/vigilio-docs/blob/main/backend-node-nest/43-backend-technologies-skill-2026.md) | dudas de version, API o compatibilidad del stack |
| [Contratos API backend](https://github.com/VigilioYonatan/vigilio-docs/blob/main/software-factory/backend-api-contracts.md) | HTTP, BFF, OpenAPI, Swagger o breaking change |
| modulo vecino equivalente dentro de `src/` | siempre; es la convencion ejecutable |

Las reglas y ejemplos viven en `vigilio-docs`; esta referencia no los duplica.

## Uso Desde La Skill

1. Leer `AGENTS.md`, OpenSpec y las fuentes aplicables.
2. Identificar aggregate, caso de uso, invariantes y owner del contrato.
3. Comparar con un modulo vecino vigente y con las versiones instaladas.
4. Implementar la vertical slice sin inventar capas, status, auth o componentes.
5. Invocar las skills de testing, persistencia, seguridad, realtime o workers segun el cambio.
6. Ejecutar los gates reales del consumidor y reportar evidencia.

En contract-first, el YAML aprobado conserva autoridad. En code-first, exportar y validar el OpenAPI.
Usar nombres CRUD genericos solo cuando el repositorio los adopte; un caso de uso con contrato propio
conserva nombres semanticos estables como `crearEndoso`.
