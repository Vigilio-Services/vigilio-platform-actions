---
name: mobile-mfe-quality
description: Audit React Native accessibility, performance, lifecycle resilience, offline behavior, bundle budgets, and privacy-aware observability. Use for screen reviews, list rendering, startup, memory, accessibility, AppState/NetInfo behavior, crash telemetry, performance regressions, Expo export size, or release quality gates.
owner: mobile-platform
lifecycle: stable
introduced_in: 0.7.0
routing_ecosystems: "mobile, react-native, expo, typescript"
routing_keywords: "react-native, expo, mobile, quality"
routing_files: "app.json, package.json, eas.json"
routing_capabilities: "mobile-development, quality"
requires: []
optional: []
conflicts: []
supersedes: []
---

# Mobile MFE Quality

## Lectura obligatoria de referencias

Antes de actuar, leer de principio a fin cada archivo `references/*` enlazado por esta skill. Dentro
de cada referencia aplicable, abrir y leer completas todas las fuentes canónicas enlazadas; no basta
con leer títulos, tablas o resúmenes. Si una fuente requerida no es accesible, identificarla y no
afirmar cumplimiento ni cerrar el gate que dependa de ella.

Evaluate quality on native constraints rather than browser metrics.

## Workflow

1. Identify supported OS versions, devices, orientation, font scaling, connectivity, and release profile.
2. Review the changed screen against [references/quality-checklist.md](references/quality-checklist.md).
3. Measure or test the highest-risk path; do not infer runtime performance from source alone.
4. Keep list rendering virtualized, renders bounded, images sized, and expensive work outside interaction frames.
5. Verify loading, empty, error, retry, background/foreground, offline/online, and cancellation behavior.
6. Add privacy-safe crash and operational context without payloads, tokens, or PII.
7. Enforce export/bundle budgets and document any approved exception with an owner and expiry.

## Guardrails

- Do not apply Lighthouse, DOM accessibility, or browser caching guidance as native evidence.
- Do not disable font scaling globally to preserve layout.
- Do not collect high-cardinality identifiers or raw API payloads in telemetry.
- Do not promise cold-start, frame-rate, or memory targets without measurement on representative hardware.

## Validation

Run accessibility-focused component tests, lifecycle tests, Expo checks, export and budget gates. Add device profiling and release monitoring evidence when the risk requires it.

> Fuente única para **Correcto / Incorrecto: manejo de existente**: [abrir documento canónico](../.vigilio-docs/standards/engineering/refactoring-existing-code.md).

## ✅ Correcto / ❌ Incorrecto — tarea `mobile-mfe-quality`

✅ **Correcto:** en esta tarea, comprobar contratos React Native, permisos de dispositivo y estados offline; remitir la norma compartida al documento propietario.

❌ **Incorrecto:** en esta tarea, suponer que los adaptadores web funcionan automáticamente en Expo; inventar pruebas o pegar el mismo procedimiento transversal en varias skills.

## Guías de librerías por versión — lectura antes de usar sus APIs

Las versiones de esta skill no se copian aquí: comprobar lockfile y [versión canónica](../.vigilio-docs/technology/versions.md). Cuando la tarea utilice una de estas dependencias, **abrir el `.md` completo** y consultar su migración ✅/❌ antes de escribir código; el resto no es obligatorio para una tarea que no la utiliza.
- [react-native](../.vigilio-docs/technology/libraries/react-native.md)
- [expo](../.vigilio-docs/technology/libraries/expo.md)
- [expo-secure-store](../.vigilio-docs/technology/libraries/expo-secure-store.md)

✅ Correcto: versionar el consumidor y seguir los ejemplos de la API instalada; enlazar documento propietario.  ❌ Incorrecto: copiar APIs legacy, duplicar normas en la skill o instalar nuevas dependencias sin gate.

