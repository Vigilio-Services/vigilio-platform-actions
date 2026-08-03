---
name: mobile-mfe-testing
description: Design and execute honest React Native test coverage with Jest, React Native Testing Library, contract tests, and Maestro. Use for unit, component, screen, lifecycle, navigation, upload, accessibility, integration, E2E, coverage thresholds, flaky tests, or CI evidence for an Expo application.
---

# Mobile MFE Testing

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
