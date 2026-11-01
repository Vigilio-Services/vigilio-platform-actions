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

**NO crear carpetas por reflejo**: `const/`, `types/`, `libs/`, `interfaces/`, `shared/` son opcionales. Colocar símbolos según propietario, cohesión, reuso real y dependencia; constantes locales permanecen en función si no expresan política compartida. `config/` para parámetros de runtime, `contracts/ports/` para fronteras, `lib/` para utilidades puras propietarias, `shared/` para uso transversal confirmado.

## Procedimiento

1. Inspeccionar archivos reales e imports afectados; distinguir código nuevo de API publicada.
2. Clasificar cada símbolo `LOCAL | FEATURE_POLICY | FEATURE_CONTRACT | CROSS_FEATURE | PUBLIC_API | SECRET_RUNTIME`.
3. Solo extraer símbolos que lo justifican; no romper DI, circularidad, seguridad, tests ni rutas del framework.
4. Buscar consumidores (import graph + búsquedas) y preservar nombres externos; migrar exports cuando sea necesario.
5. Probar unitarios, integración y contratos del stack; REVIEW read-only; reportar resultados.

## Correcto / Incorrecto

✅ `auth/config/password-hashing.config.ts` para política Argon2 compartida; `auth/application/ports` para puerto, servicio enfocado. ✅ `const session = ...` local en AuthService. ✅ `MovementConfig` Godot en Resource feature reutilizada.

❌ mover cada `const` local a `const/`; declarar interfaces de Auth en el service; crear `shared/` sin segundo consumidor; mover parámetros secretos a Git; `pub` Rust global sin necesidad; autoload Godot para cada constante; hacer mass rename sin tests.

