---
name: shared-technologies
description: Verifica compatibilidad real de TypeScript, Node.js, pnpm, Zod, OpenAPI, contratos browser-safe, Vitest, Playwright, Biome, tsx, Husky y paquetes privados compartidos. Usar antes de generar o revisar codigo frontend/backend, cambiar versiones, consumir contratos, configurar tooling o resolver un STACK_* mismatch.
owner: governance-platform
lifecycle: stable
introduced_in: 0.7.0
routing_ecosystems: "cross-stack"
routing_keywords: "engineering, standards, governance, shared-technologies"
routing_files: "package.json"
routing_capabilities: "engineering-standards, governance"
requires: []
optional: []
conflicts: []
supersedes: []
---

<skill-content>

# Tecnologias compartidas 2026

## Lectura obligatoria de referencias

Antes de actuar, leer de principio a fin cada archivo `references/*` enlazado por esta skill. Dentro
de cada referencia aplicable, abrir y leer completas todas las fuentes canónicas enlazadas; no basta
con leer títulos, tablas o resúmenes. Si una fuente requerida no es accesible, identificarla y no
afirmar cumplimiento ni cerrar el gate que dependa de ella.

Usar esta skill como firewall de versiones, no como permiso de actualizacion automatica.

## Flujo obligatorio

1. Leer `AGENTS.md`, `package.json`, `pnpm-lock.yaml`, runtime/container y configuracion ejecutable del target.
2. Resolver primero el perfil de producto y su pareja contractual; nunca inferirla solo por nombres parecidos.
3. Verificar exports y `.d.ts` instalados antes de usar una API version-sensitive.
4. Comparar con documentacion oficial del major/minor resuelto solo cuando haga falta.
5. Mantener el typecheck TypeScript separado de Vite, Biome, `tsx` y el test runner.
6. Validar `unknown` en boundaries con Zod; no duplicar schemas como interfaces manuales.
7. Ejecutar los gates reales del repositorio y reportar evidencia, no un PASS narrativo.

## Perfiles contractuales Vigilio

- `current-web`: `bus-impl` -> `@vigilioyonatan/bus-contracts` -> `web-mfe`.
- `k8s-v2`: `bus-impl-v2` -> `@vigilioyonatan/bus-v2-contracts` -> `web-mfe-v2`.

Cruzar owner, package o consumer entre perfiles es `CONTRACT_OWNER_MISMATCH`. Ambos frontends estan materializados y mantienen ciclos de release independientes.

## Estados fail-closed

- `STACK_VERSION_MISMATCH`: manifest, lockfile o runtime no coinciden.
- `STACK_API_MISMATCH`: la API pertenece a otro major/minor.
- `STACK_REVIEW_REQUIRED`: hay varias alternativas validas sin decision ejecutable.
- `CONTRACT_OWNER_MISMATCH`: owner/package/consumer pertenecen a perfiles distintos.
- `PRIVATE_PACKAGE_API_UNKNOWN`: no se verificaron exports/tipos del paquete privado.
- `TARGET_NOT_MATERIALIZED`: el target esta aprobado, pero aun no existe codigo verificable.

No cambiar dependencias, contratos ni runtime como efecto lateral de una feature.

Lee [references/technology-baseline.md](references/technology-baseline.md). Abre la fuente canónica aplicable enlazada allí antes de resolver compatibilidad.


> Fuente única para **Correcto / Incorrecto: manejo de existente**: [abrir documento canónico](../.vigilio-docs/standards/engineering/refactoring-existing-code.md).


## Fuente única de versiones

- [Versiones verificadas, políticas de compatibilidad y gates](../.vigilio-docs/technology/versions.md). No duplicar números de versión de ejemplos de documentación ni saltarse locks.

✅ Correcto: consultar esta fuente central antes de un upgrade.

❌ Incorrecto: inferir la versión instalada solamente por el nombre de la skill.

## Guías de librerías por versión — lectura antes de usar sus APIs

Las versiones de esta skill no se copian aquí: comprobar lockfile y [versión canónica](../.vigilio-docs/technology/versions.md). Cuando la tarea utilice una de estas dependencias, **abrir el `.md` completo** y consultar su migración ✅/❌ antes de escribir código; el resto no es obligatorio para una tarea que no la utiliza.
- [typescript](../.vigilio-docs/technology/catalog/typescript.md)
- [php](../.vigilio-docs/technology/catalog/php.md)
- [pnpm](../.vigilio-docs/technology/libraries/pnpm.md)
- [zod](../.vigilio-docs/technology/libraries/zod.md)

✅ Correcto: versionar el consumidor y seguir los ejemplos de la API instalada; enlazar documento propietario.  ❌ Incorrecto: copiar APIs legacy, duplicar normas en la skill o instalar nuevas dependencias sin gate.

