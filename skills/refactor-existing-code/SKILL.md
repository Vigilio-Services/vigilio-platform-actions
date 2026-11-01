---
name: refactor-existing-code
description: Refactoriza código existente de PHP/Laravel o TypeScript/NestJS sin romper contratos, reglas de negocio, seguridad ni evidencia.
owner: governance-platform
lifecycle: stable
introduced_in: 0.7.0
routing_ecosystems: "cross-stack"
routing_keywords: "engineering, standards, governance, refactor-existing-code"
routing_files: "package.json"
routing_capabilities: "engineering-standards, governance"
requires: []
optional: []
conflicts: []
supersedes: []
---

<skill-content>

# Refactorizar código existente — Vigilio

## Activación

Usar al recibir módulos heredados, controladores monolíticos, DTOs duplicados, bucles con side effects, N+1, código sin pruebas, APIs deprecadas o una modernización de dependencias.

## Secuencia obligatoria

1. Leer `AGENTS.md`, reglas humanas aprobadas, código vecino, versiones instaladas y lockfiles. Registrar baseline.
2. Consultar `references/refactoring-gates.md` y guías canónicas de Vigilio Docs según stack; no asumir que `main` refleja la versión aprobada.
3. Identificar comportamiento, usuarios, contratos OpenAPI/Scalar, roles/tenants, transacciones, jobs, métricas y dependencias.
4. Crear tests de caracterización antes de modificar flujos de alto riesgo. Proponer una división incremental y rollback cuando aplique.
5. Diferenciar el problema: error, seguridad, N+1, claridad, complejidad o simple estilo. Priorizar riesgo real.
6. Refactorizar localmente y conservar nombres públicos si son contrato; usar métodos semánticos DDD para nuevos casos de uso sin renombrar en masa.
7. Ejecutar tests/gates disponibles y reportar evidencia exacta con PASS/FAIL/BLOCKED/NOT_RUN.

## ✅ Correcto / ❌ Incorrecto

- ✅ `map` para transformación, `for...of`/`foreach` para efectos; un `for` por índice sigue siendo válido cuando aporta claridad o es necesario.
- ❌ Reemplazar `for` por `.map()` ciegamente o llamar `forEach(async ...)` sin esperar.
- ✅ Reutilizar `productSchema.pick()` y OpenAPI; FormRequests PHP producen el mismo contrato JSON; evitar conversiones y parse repetidos en salida sólo para tipar.
- ❌ Migrar ORM, runtime, endpoints, permisos y cache de golpe; declarar integración aprobada tras ejecutar únicamente lint/sintaxis.

## Restricciones

- No editar `docs/rules/**` ni responder decisiones humanas pendientes. Mantener ADRs históricos y fuentes canónicas.
- Evitar cualquier output que afirme compatibilidad de versiones sin `composer.lock`/`pnpm-lock.yaml` y tests.
- No ejecutar acciones destructivas o publicar npm/CI sin autorización.

## Lectura obligatoria de referencias

Leer [references/refactoring-gates.md](references/refactoring-gates.md).

</skill-content>

**Ownership por feature:** si esta tarea mueve constantes, tipos, Resources, componentes o utilidades, abrir [file-and-symbol-ownership](../.vigilio-docs/standards/engineering/file-and-symbol-ownership.md) y la guía específica del stack. No forzar carpetas globales por defecto.

