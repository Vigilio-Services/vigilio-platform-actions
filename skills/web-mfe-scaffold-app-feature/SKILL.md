---
name: web-mfe-scaffold-app-feature
description: Crea o reorganiza aplicaciones y features frontend web-mfe con estructura por dominio/aplicacion, operaciones API, hooks TanStack Query, componentes descriptivos, contratos compartidos y tests adyacentes. Usar al iniciar apps/{dominio}/{aplicacion}, agregar features como users/products/orders, crear operaciones index/store/update/destroy o corregir carpetas, nombres y boundaries inconsistentes.
---

<skill-content>

# Scaffold App Y Feature Web MFE

Usar la documentación canónica; no mantener una segunda arquitectura dentro de esta skill.

## Flujo obligatorio

1. Leer [references/canonical-docs.md](references/canonical-docs.md).
2. Revisar `AGENTS.md`, configuración de la app y una feature vecina equivalente.
3. Decidir si el cambio requiere otra aplicación desplegable o una feature en una app existente.
4. Confirmar operaciones y contratos publicados antes de crear APIs/hooks/componentes.
5. Crear solo carpetas con archivos reales; mantener
   `componente -> hooks/use-product-index-query.ts -> features/{feature}/services/product-index.api.ts -> backend`.
6. Nombrar por dominio y acción: APIs HTTP granulares por operación en kebab-case (`product-index.api.ts`, `product-store.api.ts`), y custom hooks en kebab-case (`use-product-index-query.ts`, `use-product-store-mutation.ts`). Evitar camelCase como `useProductIndex.ts` y archivos monolíticos como `product.service.ts`.
7. Invocar `web-mfe-contracts`, `web-mfe-testing`, `web-mfe-design-system`, `web-mfe-quality` o `web-mfe-security-delivery` según el riesgo.
8. Ejecutar los gates del consumidor y reportar con precisión lo no verificado.

## Límites

- No inventar DTOs ni crear `libs/contracts`.
- No generar carpetas vacías, placeholders o tests sin assertions útiles.
- No crear una aplicación nueva por una pantalla.
- No agrupar múltiples operaciones API en un solo archivo monolítico (ej. `product.service.ts`); usar `product-index.api.ts`, `product-store.api.ts`, etc.
- No nombrar hooks en camelCase (`useProductIndex.ts`); usar la convención kebab-case (`use-product-index-query.ts`).
- No crear `features/products/products/`; si `products`, `categories` y `brands` son hermanas, usar
  un padre agregador real y dar a cada hija sus propias capas.
- No mover APIs de negocio a `src/services/`; esa carpeta queda para infraestructura transversal.
- No usar `shared/` sin al menos dos consumidores del mismo nivel.
- No mover archivos existentes sin revisar imports, rutas, tests y ownership.
- No declarar que el repositorio usa Module Federation solo por llamarse `web-mfe`.

</skill-content>
