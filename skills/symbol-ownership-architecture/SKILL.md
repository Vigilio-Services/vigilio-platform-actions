---
name: symbol-ownership-architecture
description: Revisión e implementación de ownership de constantes, tipos, interfaces, puertos, utilidades y shared por feature para cualquier stack.
owner: governance-platform
lifecycle: stable
introduced_in: 0.7.0
routing_ecosystems: "any"
routing_keywords: "const,constants,tipos,types,interfaces,libs,shared,carpetas,archivos,servicio,service,ownership,symbol,organizar codigo"
routing_files: "package.json"
routing_capabilities: "architecture,feature"
requires: []
optional: []
conflicts: []
supersedes: []
---

# symbol-ownership-architecture — ejecución Senior/Staff


## Lectura canónica

- [Ownership transversal](../.vigilio-docs/standards/engineering/file-and-symbol-ownership.md)
- [Naming y boundaries](../.vigilio-docs/standards/engineering/naming-and-boundaries.md)
- [Review de cambio](../.vigilio-docs/standards/engineering/change-impact-and-review-gates.md)
- Solo la **guía del stack detectado**: `stacks/backend/nestjs/architecture/module-symbol-ownership.md`, `stacks/backend/laravel/architecture/module-symbol-ownership.md`, `stacks/rust/core/module-symbol-ownership.md`, `stacks/cpp/core/module-symbol-ownership.md`, `stacks/godot/core/module-symbol-ownership.md`, `stacks/frontend/web-mfe/ui/component-symbol-ownership.md` o `stacks/mobile/expo/ui/component-symbol-ownership.md`.

## Regla de decisión

**Constantes de Negocio vs Variables Locales**:
- **OBLIGATORIO extraer a `constants/*.constants.ts` (o `config/`)**: Magic numbers, límites operativos, TTLs, regexes, políticas de retry y códigos de error del módulo. Jamás mantener constantes de negocio hardcodeadas dentro de los servicios.
- **Variables locales en función**: Variables temporales (`const total = a + b`, `const item = await ...`) permanecen dentro del scope de su método. NO crear carpetas por reflejo para variables locales efímeras.
- **NO crear carpetas vacías por reflejo**: `libs/`, `interfaces/`, `shared/` solo se crean cuando existe un segundo consumidor real o un boundary arquitectónico confirmado.

**Contratos vs Interfaces según Stack Backend**:
- **Backend TS + NestJS + Zod**: El backend es el Single Source of Truth (`src/**/presentation/http/dto/`, `domain/schemas/`). Se compila el paquete `packages/contracts` (o `@vigilioyonatan/*-contracts`) y el frontend/cliente lo consume directamente reutilizando DTOs y schemas.
- **Backend NO TS / NO Nest (Laravel, Python, Go, API externa 3rd party)**: No aplica generar contratos desde NestJS. El frontend/consumer declara legítimamente sus propias `interfaces/`, `types/` y DTOs locales (o generados vía OpenAPI/Swagger) sin crear un paquete de contratos fantasma.

## Procedimiento

1. Inspeccionar archivos reales e imports afectados; distinguir código nuevo de API publicada.
2. Clasificar cada símbolo `LOCAL | FEATURE_POLICY | FEATURE_CONTRACT | CROSS_FEATURE | PUBLIC_API | SECRET_RUNTIME`.
3. Extraer constantes de módulo a `{feature}/constants/{feature}.constants.ts` y parámetros de runtime a `config/`.
4. En contratos: si el backend es NestJS/TS, reutilizar DTOs/schemas compilados en `packages/contracts`; si el backend no es TS/Nest, definir `interfaces/` y `types/` locales en el consumidor.
5. Solo extraer shared/libs cuando existe segundo consumidor verificado; no romper DI, circularidad, seguridad ni tests.
6. Probar unitarios, integración y contratos del stack; REVIEW read-only; reportar resultados.

## Correcto / Incorrecto

✅ `orders/constants/orders.constants.ts` (`MAX_ORDER_ITEMS = 50`, `ORDER_TIMEOUT_MS = 5000`) importado en `OrdersService`.
✅ Backend NestJS: DTOs en `src/orders/presentation/http/dto/` exportados y consumidos por frontend vía `packages/contracts`.
✅ Frontend con backend Laravel/Python: `interfaces/order.interface.ts` y `types/order-status.type.ts` definidos localmente en el frontend.
✅ `const total = items.reduce(...)` como variable local dentro de un método de `OrdersService`.

❌ Hardcodear `if (items.length > 50)` o `await sleep(5000)` dentro de `OrdersService` sin extraer constante.
❌ Mover variables locales temporales (`const result = ...`) a una carpeta `const/`.
❌ En Backend NestJS: duplicar manualmente interfaces y tipos en el frontend en vez de reutilizar el paquete de contracts.
❌ En Backend Laravel/Python: inventar un paquete `packages/contracts` de NestJS que no existe.
❌ Crear `shared/` o `libs/` sin un segundo módulo consumidor real.

