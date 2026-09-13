---
name: shared-technologies
description: Verifica compatibilidad real de TypeScript, Node.js, pnpm, Zod, OpenAPI, contratos browser-safe, Vitest, Playwright, Biome, tsx, Husky y paquetes privados compartidos. Usar antes de generar o revisar codigo frontend/backend, cambiar versiones, consumir contratos, configurar tooling o resolver un STACK_* mismatch.
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

</skill-content>
