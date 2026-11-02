---
name: vigilio-architecture-guide
description: Comprende, navega, audita y evoluciona el ecosistema Vigilio (vigilio-docs, vigilio-skills, paquetes npm, perfiles, NestJS, Laravel, DDD, SOLID, Zod, OpenAPI, AWS/EKS/Lambda, CI/CD, observabilidad y modernización existente). Usar al analizar la arquitectura de carpetas, crear o actualizar documentación/skills, seleccionar perfiles, rastrear reglas canónicas, implementar features multistack o preparar cambios seguros sin perder archivos existentes.
owner: governance-platform
lifecycle: stable
introduced_in: 0.7.0
routing_ecosystems: "cross-stack"
routing_keywords: "engineering, standards, governance, vigilio-architecture-guide"
routing_files: "package.json"
routing_capabilities: "engineering-standards, governance"
requires: []
optional: []
conflicts: []
supersedes: []
---

# Vigilio Architecture Guide — conocimiento y operación del ecosistema

> Fuente única para **Navegación canónica multistack 2026**: [abrir documento canónico](../.vigilio-docs/stacks/backend/nestjs/README.md).


## 0. Inicio obligatorio: descubrir estado real

1. Identificar qué hay disponible: repositorios fuente `vigilio-docs/` + `vigilio-skills/`, snapshot de consumo `.opencode/skills/.vigilio-docs/` / `.agents/skills/.vigilio-docs/`, o únicamente código consumidor.
2. Leer `AGENTS.md` y las políticas relevantes del consumidor. Detectar `docs/rules/**`, OpenSpec, configuración, código, tests, lockfiles, tool versions, módulos vecinos y pipeline. No reemplazar decisiones humanas ni leer secretos.
3. Leer [arquitectura y propiedad](references/01-architecture-and-ownership.md) y [rutas canónicas de docs](references/02-docs-and-navigation.md) antes de afirmar que una ruta o capacidad existe.
4. Si se solicita un **inventario exhaustivo de archivos o perfiles**, consultar [inventario exacto del snapshot](references/08-exact-inventory.md) y verificar rutas actuales.
5. Si la tarea afecta instalación, publicación, perfil, docs snapshot o enlaces, leer [distribución npm](references/04-npm-sync-and-versions.md). Si es implementación técnica, leer [patrones por stack](references/05-engineering-contracts.md).
6. Consultar [enrutamiento de perfiles](references/03-skills-and-profiles.md) para seleccionar **solo las skills aplicables**. Abrir las referencias completas requeridas por las skills elegidas.
7. Antes de modificar, leer [cambio conservador](references/06-safe-change-workflow.md); antes de declarar terminado, aplicar [gates y anti-patrones](references/07-validation-and-anti-patterns.md).

**Fuentes:** primero políticas y código ejecutable del consumidor, contratos/ADR y decisiones aprobadas; usar el snapshot de `vigilio-docs` para estándares y tutoriales. Ante contradicción no elegir a ciegas: registrar drift, preservar comportamiento externo y solicitar autorización para modificar decisiones humanas.

## 1. Mapa real: dónde se documenta cada cosa

- `vigilio-docs/foundations/`: DDD, SOLID, hexagonal; principios independientes del lenguaje.
- `standards/`: API, seguridad, caché, mensajería, testing, observabilidad, DevSecOps, modernización y colecciones.
- `technology/`: catálogo y **baselines propuestos**, sujetos a lockfiles y prueba del consumidor.
- `stacks/backend/nestjs/`: documentación **canónica de implementación** con tutorial completo; los 49 capítulos anteriores se conservan en carpetas `references/` clasificadas por responsabilidad; su ubicación está documentada en `stacks/backend/nestjs/migration-content-map.md`.
- `stacks/backend/laravel/`: Laravel/PHP, controllers, Form Requests, Resources, DTOs, casos de uso, Eloquent, Redis, OpenAPI/Scalar, testing, observabilidad y despliegue.
- `platform/`: las **3 arquitecturas canónicas de plataforma** ([reference-topologies.md](../.vigilio-docs/platform/architecture/reference-topologies.md)): Nivel 1 `compose-vps` ([cloud-neutral-vps-delivery.md](../.vigilio-docs/platform/compose/cloud-neutral-vps-delivery.md), Docker/Podman Compose endurecido para 1–3 VPS sin Kubernetes), Nivel 2 `k8s-gitops-selfhosted` (RKE2/K3s, Cilium eBPF, Gateway API, Argo CD/Rollouts, Kyverno CEL, Tetragon, CloudNativePG) y Nivel 3 `cloud-aws-gitops` (AWS Orgs, VPC 3-AZ, EKS/Aurora/CloudFront/Outbox->SNS->SQS, Terraform + Floci); la ejecución reutilizable vive en `vigilio-platform-actions` cuando existe.
- `playbooks/`, `software-factory/`, `adr/`, `threat-model/`, `examples/`: procedimientos, gobierno, decisiones y ejemplos. **Los ADR históricos no se reescriben automáticamente.**
- `vigilio-skills/assets/skills/`: skills planas por tarea/framework; `assets/profiles.json`: composición por perfil; `assets/docs/`: copia documental offline con hashes en `assets/docs-manifest.json`; `src/` y `dist/`: sincronizador npm.

## 2. Decisiones de ingeniería vigentes

- DDD **pragmático**: `listProducts()`, `searchProducts()`, `approvePolicy()`, `cancelOrder()`, `activateSubscription()`, `calculatePremium()`; `save()` en repositorio es correcto. Invariantes en dominio cuando existan, sin agregados ceremoniales para CRUD trivial.
- Controllers delgados; casos de uso / application services desacoplados de HTTP/ORM; repository ports y adapters; `constants/`, `types/`, `enums/` y value objects en la **capa propietaria**, solo cuando aporten valor. Mantener `z.infer` junto al schema Zod propietario. **Prohibido crear carpetas globales `contracts/` o `packages/contracts/`**: los schemas viven en `<modulo>/domain/schemas/*.schema.ts`, los DTOs HTTP en `<modulo>/presentation/http/dto/*.dto.ts` y la compatibilidad entre servicios se audita con `openapi diff` en CI.
- NestJS: `productSchema.pick()`/`.omit()`, `createPaginatorDto()`, Zod v4 y tipos inferidos; entradas validadas en borde, `z.coerce`/`transform` restringidos en query, `Promise<ResponseDto>` tipado; adaptadores `*DocDto` para OpenAPI/Scalar, sin `.parse()` repetido de salida solo para tipar. Frontend puede confiar en el tipo de una API controlada, pero una aserción `as` **no valida** JSON.
- Laravel: Form Request/Policies, DTOs PHP `readonly`, Resources/presenters explícitos, Eloquent en infraestructura, contrato OpenAPI interoperable; no intentar ejecutar Zod en PHP.
- Redis/Valkey: claves por tenant/filtros/permisos, TTL, invalidación exacta o generación de namespace **después de commit**; `DEL('prefix:*')` no borra por patrón. Outbox, reintentos e idempotencia si son necesarios.
- Seguridad privada por defecto, autorización por recurso/tenant, mínimos privilegios y datos sensibles fuera de logs. Pino/Monolog + OpenTelemetry + métricas/trazas/logs + SLO y pruebas.
- existente: no reemplazar bucles por moda; `map()` transforma, `for...of`/`foreach` sirven para efectos/async secuencial, `for` indexado cuando el algoritmo requiere índices. Investigar N+1, races, filtrado y permisos antes de refactorizar.

## 3. Procedimiento al recibir una tarea

1. Clasificar: **explicar**, **auditar**, **crear feature**, **actualizar docs**, **agregar skill**, **distribuir npm**, **migrar framework/runtime** o **refactorizar existente**.
2. Descubrir módulo real y capacidad requerida. Localizar dueño canónico; inspeccionar implementaciones/test/locks antes de copiar un ejemplo de Markdown.
3. Seleccionar perfil según la topología real sin mezclar rutas incompatibles ni sobreingenierizar: `node-nest` + `node-nest-compose` / `platform-compose-vps` (Nivel 1: 1–3 VPS con Docker/Podman Compose sin Kubernetes), `platform-onprem-production` (Nivel 2: Kubernetes GitOps autoalojado / soberanía de datos), o `node-nest-eks` / `platform-aws-production` **o** `node-nest-lambda` (Nivel 3: AWS); `core-cross-stack` + `php-laravel` para PHP; `core` histórico es principalmente Node.
4. Explicar diseño y riesgos, o aplicar cambio acotado. No editar `generated/**`, `_site/`, `assets/docs/`, lockfiles o archivos gestionados directamente como si fueran fuentes humanas. Regenerar mediante herramienta canónica cuando corresponda.
5. Preservar todo el contenido humano útil; ampliar sin borrar. Si hay migración de ruta, mantener enlaces/redirects o compatibilidad mientras se verifica que todos los consumidores cambiaron.
6. Ejecutar comandos aplicables y recopilar evidencia real. Para comandos no disponibles informar `NOT_RUN`/`BLOCKED`, nunca inventar `PASS`.
7. Informar archivos tocados, por qué, referencias canónicas, pruebas realizadas, incompatibilidades, acciones pendientes y si hubo publicación real.

## 4. Diagnóstico opcional (solo lectura)

Con Node.js disponible, ejecutar desde el proyecto/instalación:

```bash
node .opencode/skills/vigilio-architecture-guide/scripts/inspect-vigilio.mjs --json
# o desde fuente:
node vigilio-skills/assets/skills/vigilio-architecture-guide/scripts/inspect-vigilio.mjs --strict
```

El script **no modifica nada**. Comprueba rutas críticas de documentación, enlaces relativos de las referencias de esta skill y perfiles cuando están disponibles. Un resultado positivo **no equivale** a pruebas de código, integración, seguridad, contratos ni despliegue.

## 5. Cómo entregar la respuesta

Para cambios: describir `Objetivo → dueño canónico → archivos existentes → plan/diff mínimo → skills necesarias → pruebas/evidencia → riesgos`.
Para auditorías: agrupar `P0/P1/P2`, ubicación exacta, reproducción, corrección y evidencia.
Para contenido técnico: ejemplo **✅ Correcto / ❌ Incorrecto** contextual, con imports/dependencias explícitos o marca de pseudocódigo, respetando el baseline real.

**No garantizar “100% completo”, “production-ready” ni “últimas versiones instaladas” a partir de la existencia de Markdown o de un `check` del paquete.**

## Extensión: IA/RAG, LLMOps y FinOps

El perfil `ai-rag` incorpora `ai-rag-llmops-finops` y reutiliza documentación local bajo `.vigilio-docs/standards/ai/`, `.vigilio-docs/foundations/ai/`, `.vigilio-docs/platform/ai/` y `.vigilio-docs/playbooks/ai-rag/`. No sustituye las skills NestJS/Laravel/seguridad.

El playbook recibido contiene ejemplos **no ejecutables como sistema**: RLS tenant sin ACL por documento, presupuestos YAML sin enforcement y seis casos JSONL sin runner. Ver [propiedad de IA](references/09-ai-rag-llmops-finops.md) antes de afirmar que están en producción.


## Migración definitiva NestJS, sin duplicar normas

- Consultar primero `.vigilio-docs/stacks/backend/nestjs/README.md` y `.vigilio-docs/stacks/backend/nestjs/migration-content-map.md`.
- Los 49 capítulos históricos están reubicados por responsabilidad (también en `standards/`, `technology/`, `platform/` y `playbooks/`). Consultar el mapa SHA-256 en lugar de buscar otra carpeta antigua.
- Ninguna operación sobre documentos debe destruir texto humano, código, decisiones o referencias; demostrar trazabilidad antes de aprobar.
- ✅ Correcto: aplicar primero principios comunes y luego guía específica NestJS/Laravel.
- ❌ Incorrecto: reintroducir una segunda fuente normativa o marcar un índice breve como migración completa.

> Fuente única para **Fuente única de versiones**: [abrir documento canónico](../.vigilio-docs/technology/versions.md).


## Gate universal de completitud

Antes de declarar Docs, Skills o un ZIP terminado, aplicar **`complete-work-no-shortcuts`**: inventariar **cada archivo**, clasificar dueño canónico frente a índice/referencia histórica, ampliar únicamente brechas comprobadas y demostrar preservación con hashes. **No confundir 3 prácticas de muestra con una estrategia completa**, ni fabricar cantidades o estados PASS. La documentación transversal se mantiene en `foundations/` y `standards/`, las integraciones en `stacks/`, y las versiones en `technology/versions.md`.

✅ Correcto: matriz origen → estado → ampliación necesaria → prueba realizada. ❌ Incorrecto: comprimir silenciosamente 50 controles en tres bullets para reducir tokens.



> Fuente única para **Alineación vigente Vigilio — 2026**: [abrir documento canónico](../.vigilio-docs/standards/engineering/naming-and-boundaries.md).

## Entrada automática complementaria

Para una petición de trabajo en lenguaje natural, utilizar `vigilio-auto-senior` (si está instalada/activada) como orquestador. Esta skill de arquitectura mantiene su función orientadora y no suplanta `review-code-change`. [Norma](../.vigilio-docs/standards/ai/skill-orchestration-policy.md).


## Capacidades Rust/C++ y descubrimiento futuro — lectura condicionada

- [Descubrimiento agnóstico de tecnologías futuras](../.vigilio-docs/standards/ai/dynamic-capability-discovery.md): leer en tareas de arquitectura nueva, elección de stack, monorepos y selección automática de skills.
- [Rust Core](../.vigilio-docs/stacks/rust/README.md): cuando existe Cargo o se evalúa Rust; cargar GPUI/CLI/backend solo si el caso aplica.
- [C++ Core](../.vigilio-docs/stacks/cpp/README.md): cuando existen CMake/C++ o se evalúa C++; Qt y WebEngine son condicionales, no defaults.
- Inspeccionar archivos de los subproyectos `apps/`, `crates/`, `packages/`; reconocer `Cargo.toml`, `CMakeLists.txt`, targets y dependencias. En una idea sin código comparar alternativas y preguntar decisiones relevantes, no fingir que una tecnología está instalada.
- El catálogo de metadatos se construye desde las propias skills (`routing_*`); una futura skill de videojuegos puede descubrirse sin modificar reglas particulares del router. **No fingir** que propuestas son lecturas, implementaciones o pruebas.
- ✅ Correcto: evaluar tecnologías en paralelo solo en fase de decisión, seleccionar una tras evidencia y cargar la skill completa. ❌ Incorrecto: aplicar GPUI a C++ o Qt a Rust solo por mencionar desktop.

**Ownership por feature:** si esta tarea mueve constantes, tipos, Resources, componentes o utilidades, abrir [file-and-symbol-ownership](../.vigilio-docs/standards/engineering/file-and-symbol-ownership.md) y la guía específica del stack. No forzar carpetas globales por defecto.


## Lectura obligatoria de referencias

Consultar las referencias locales del módulo antes de ejecutar modificaciones normativas.

