---
name: mobile-mfe-build-feature
description: Implement Expo and React Native features with Expo Router, native lifecycle handling, explicit state ownership, accessibility, and minimal dependencies. Use for screens, routes, feature modules, navigation, uploads, permissions, offline behavior, or changes under app/, src/screens/, src/features/, src/providers/, and native configuration.
---

# Mobile MFE Build Feature

## Lectura obligatoria de referencias

Antes de actuar, leer de principio a fin cada archivo `references/*` enlazado por esta skill. Dentro
de cada referencia aplicable, abrir y leer completas todas las fuentes canónicas enlazadas; no basta
con leer títulos, tablas o resúmenes. Si una fuente requerida no es accesible, identificarla y no
afirmar cumplimiento ni cerrar el gate que dependa de ella.

Build a vertical mobile slice without importing browser or backend patterns.

## Workflow

1. Read the repository instructions, installed versions, neighboring features, and executable tests.
2. Identify the route, screen, domain feature, service boundary, contract, and native capability involved.
3. Assign each state value to exactly one owner:
   - TanStack Query for server state.
   - React Hook Form for form state.
   - Expo Router for navigation state.
   - Preact Signals for small shared reactive client state.
   - local component state only for ephemeral UI.
   - SecureStore only for sensitive device persistence.
4. Keep route files thin. Put composition in `src/screens/`, domain behavior in `src/features/`, and cross-cutting adapters in `src/services/` or `src/providers/`.
5. Keep one recognizable HTTP operation per feature `services/*.api.ts`; keep TanStack Query in sibling hooks and JSX out of services.
6. Model loading, refresh, empty, error, retry, offline, permission-denied, and success states when applicable.
7. Add accessible labels, roles, focus behavior, touch targets, and safe-area/keyboard handling.
8. Add adjacent tests at the lowest useful layer and run the project gates that cover the changed surface.

Read [references/feature-architecture.md](references/feature-architecture.md) before designing a new route, provider, upload flow, or state boundary.

## Guardrails

- Prefer Expo SDK and React Native APIs already installed.
- Do not use `window`, `document`, `localStorage`, DOM events, CSS-only behavior, or Node built-ins in runtime code.
- Do not duplicate TanStack Query data in Signals or Zustand.
- Do not group unrelated CRUD endpoints in a monolithic `*.service.ts` or create empty feature folders preemptively.
- Do not store access or refresh tokens in AsyncStorage.
- Do not add native modules without checking Expo compatibility and build impact.
- Do not claim device behavior from a unit test or bundle export.

## Validation

Run Biome, TypeScript, relevant Jest/RNTL tests, contract governance, Expo dependency checks, and an export. Run Maestro only when a simulator/device and the required toolchain are actually available.
