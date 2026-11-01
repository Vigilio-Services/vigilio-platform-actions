---
name: mobile-mfe-build-feature
description: Implement Expo and React Native features with Expo Router, native lifecycle handling, explicit state ownership, accessibility, and minimal dependencies. Use for screens, routes, feature modules, navigation, uploads, permissions, offline behavior, or changes under app/, src/screens/, src/features/, src/providers/, and native configuration.
owner: mobile-platform
lifecycle: stable
introduced_in: 0.7.0
routing_ecosystems: "mobile, react-native, expo, typescript"
routing_keywords: "react-native, expo, mobile, build-feature"
routing_files: "app.json, package.json, eas.json"
routing_capabilities: "mobile-development, build-feature"
requires: []
optional: []
conflicts: []
supersedes: []
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

## ✅ Correcto / ❌ Incorrecto: manejo de existente

- ✅ **Correcto:** Validar deep links y permisos, controlar secretos, estados offline, accesibilidad y pruebas en dispositivos.
- ❌ **Incorrecto:** Guardar secretos permanentes sin protección, depender sólo del happy path o ignorar permisos/OTA por ambiente.
- **Gate:** no reescribir masivamente código heredado; inspeccionar baseline, tests y locks reales; reportar `NOT_RUN` si falta evidencia. La guía de refactor se consulta en `vigilio-docs/standards/engineering/refactoring-existing-code.md` según la revisión de Docs aprobada (no asumir que el link remoto `main` ya esté publicado).

## Guías de librerías por versión — lectura antes de usar sus APIs

Las versiones de esta skill no se copian aquí: comprobar lockfile y [versión canónica](../.vigilio-docs/technology/versions.md). Cuando la tarea utilice una de estas dependencias, **abrir el `.md` completo** y consultar su migración ✅/❌ antes de escribir código; el resto no es obligatorio para una tarea que no la utiliza.
- [typescript](../.vigilio-docs/technology/catalog/typescript.md)
- [expo](../.vigilio-docs/technology/libraries/expo.md)
- [react-native](../.vigilio-docs/technology/libraries/react-native.md)
- [expo-router](../.vigilio-docs/technology/libraries/expo-router.md)
- [expo-image-picker](../.vigilio-docs/technology/libraries/expo-image-picker.md)
- [expo-file-system](../.vigilio-docs/technology/libraries/expo-file-system.md)
- [tanstack-query](../.vigilio-docs/technology/libraries/tanstack-query.md)

✅ Correcto: versionar el consumidor y seguir los ejemplos de la API instalada; enlazar documento propietario.  ❌ Incorrecto: copiar APIs legacy, duplicar normas en la skill o instalar nuevas dependencias sin gate.

## APIs complementarias por versión

- [nativewind](../.vigilio-docs/technology/libraries/nativewind.md)

✅ Correcto: abrir guías cuando la funcionalidad las use. ❌ Incorrecto: importar código legacy de otro major sin confirmar manifest.


## Librerías propietarias adicionales — lectura por tarea

Estas referencias no duplican normativa: consultar la API, migración y versión instalada **solo cuando la tarea utilice la librería**.

- [react-native-gesture-handler](../.vigilio-docs/technology/libraries/react-native-gesture-handler.md)
- [react-native-reanimated](../.vigilio-docs/technology/libraries/react-native-reanimated.md)

