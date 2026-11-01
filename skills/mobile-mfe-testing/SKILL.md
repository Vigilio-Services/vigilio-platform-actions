---
name: mobile-mfe-testing
description: Design and execute honest React Native test coverage with Jest, React Native Testing Library, contract tests, and Maestro. Use for unit, component, screen, lifecycle, navigation, upload, accessibility, integration, E2E, coverage thresholds, flaky tests, or CI evidence for an Expo application.
owner: mobile-platform
lifecycle: stable
introduced_in: 0.7.0
routing_ecosystems: "mobile, react-native, expo, typescript"
routing_keywords: "react-native, expo, mobile, testing"
routing_files: "app.json, package.json, eas.json"
routing_capabilities: "mobile-development, testing"
requires: []
optional: []
conflicts: []
supersedes: []
---

# Mobile MFE Testing

## Lectura obligatoria de referencias

Antes de actuar, leer de principio a fin cada archivo `references/*` enlazado por esta skill. Dentro
de cada referencia aplicable, abrir y leer completas todas las fuentes canónicas enlazadas; no basta
con leer títulos, tablas o resúmenes. Si una fuente requerida no es accesible, identificarla y no
afirmar cumplimiento ni cerrar el gate que dependa de ella.

Choose the smallest test that proves the behavior and report exactly what ran.

## Workflow

1. Map the changed behavior to the test matrix in [references/test-matrix.md](references/test-matrix.md).
2. Test observable behavior through roles, labels, text, navigation, requests, and state transitions.
3. Mock at external boundaries: network, SecureStore, picker, filesystem, notifications, and platform APIs.
4. Keep contract fixtures minimal and valid; add malformed fixtures for boundary parsing.
5. Use deterministic timers and reset global/query/signal state between tests.
6. Run focused tests while iterating, then the repository test and coverage gates.
7. Run Maestro only on a booted target with the built app and required services reachable.
8. Record skipped device, iOS, EAS, or real-backend checks as pending evidence.

## Guardrails

- Do not test implementation details or shallow-render internals.
- Do not replace meaningful assertions with snapshots.
- Do not call a Jest/RNTL render an E2E test.
- Do not lower coverage thresholds to make a change pass.
- Do not hide open handles, flaky retries, console errors, or act warnings.

## Required Evidence

Report commands, pass/fail totals, coverage summary, target platform, and limitations. A successful Android export proves bundling, not installation, runtime permissions, network reachability, or store readiness.

> Fuente única para **Correcto / Incorrecto: manejo de existente**: [abrir documento canónico](../.vigilio-docs/standards/engineering/refactoring-existing-code.md).


## E2E nativo sin copiar patrones web

Aplicar [E2E transversal](../.vigilio-docs/standards/testing/e2e-quality-gates.md) y [E2E Expo/Maestro](../.vigilio-docs/stacks/mobile/expo/testing/e2e-maestro.md). ✅ Permisos nativos, red, deep links y OTA comprobados; ❌ simulación de componente presentada como E2E en dispositivo.

## Guías de librerías por versión — lectura antes de usar sus APIs

Las versiones de esta skill no se copian aquí: comprobar lockfile y [versión canónica](../.vigilio-docs/technology/versions.md). Cuando la tarea utilice una de estas dependencias, **abrir el `.md` completo** y consultar su migración ✅/❌ antes de escribir código; el resto no es obligatorio para una tarea que no la utiliza.
- [vitest](../.vigilio-docs/technology/libraries/vitest.md)
- [playwright](../.vigilio-docs/technology/libraries/playwright.md)
- [react-native](../.vigilio-docs/technology/libraries/react-native.md)

✅ Correcto: versionar el consumidor y seguir los ejemplos de la API instalada; enlazar documento propietario.  ❌ Incorrecto: copiar APIs legacy, duplicar normas en la skill o instalar nuevas dependencias sin gate.

