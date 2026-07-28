# @vigilioyonatan/node-nest-tooling

## 0.3.0

### Minor Changes

- Separar contratos Zod públicos y browser-safe de adaptadores NestJS/OpenAPI `*.doc.ts`.
- Excluir adaptadores de documentación del barrel y rechazar imports de NestJS o Node.js en contratos públicos.
- Permitir que `fix-esm-imports` procese un `--dist-root` explícito para paquetes publicables anidados.

## 0.2.0

### Minor Changes

- Actualizar configuración de secretos de entorno en workflows reutilizables.

## 0.1.0

### Minor Changes

- Ship the first coordinated platform toolchain release: governance file inputs, conflict-safe explicit
  skill synchronization, and executable Node/Nest tooling without consumer-side file copies. All
  package sources now use strict TypeScript and publish compiled ESM JavaScript with declarations.
  Delivery metrics, SLSA provenance, and operational evidence are provided by a dedicated cross-stack
  package.
  The release also adds the executable `node-backend-2026` platform baseline so consumers fail CI
  when Node, pnpm, Biome, TypeScript, Vitest, Semgrep, or workflow defaults drift.
