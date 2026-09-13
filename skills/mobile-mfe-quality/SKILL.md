---
name: mobile-mfe-quality
description: Audit React Native accessibility, performance, lifecycle resilience, offline behavior, bundle budgets, and privacy-aware observability. Use for screen reviews, list rendering, startup, memory, accessibility, AppState/NetInfo behavior, crash telemetry, performance regressions, Expo export size, or release quality gates.
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
