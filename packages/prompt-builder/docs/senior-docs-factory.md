# Skill: Senior Docs Factory — Human Decisions First / Prompt Builder Compatible

## Version

`1.1.0` *(alineada con `@vigilio-services/prompt-builder@0.12.1` y `@vigilio-services/vigilio-skills@0.8.3`; incluye Super-Skill integrada `senior-exhaustiveness-honesty-sync`)*

## Skill ID

`senior-docs-factory` *(con Super-Skill embebida `senior-exhaustiveness-honesty-sync`)*

## Purpose

Crear, completar, migrar, validar y empaquetar un `docs/` de proyecto **de principio a fin**, con profundidad Senior/Principal, listo para guiar implementación real y compatible con el Prompt Builder/toolchain que el proyecto use.

Esta skill es portable y puede aplicarse a:

- web apps;
- mobile apps;
- videojuegos;
- backend/API;
- desktop;
- CLI;
- libraries/SDKs;
- data/AI;
- infraestructura/platform;
- sistemas distribuidos;
- proyectos greenfield;
- proyectos brownfield;
- migraciones;
- multi-repo;
- proyectos híbridos.

La skill NO presupone framework, lenguaje, cloud, base de datos, autenticación, tenancy ni arquitectura. Todo se descubre o decide antes de generar el `docs/` final.

---

# 1. Principio central

> **Primero decisiones humanas. Después documentación. Después validación real. Después ZIP.**

Orden obligatorio:

```text
discover
→ human-decision-gate
→ answers.md resolved
→ docs blueprint
→ full-depth docs generation
→ cross-file synchronization
→ Prompt Builder/toolchain validation
→ independent senior review
→ ZIP + audit
```

Nunca generar un `docs/` final y luego descubrir preguntas materiales que debieron resolverse antes.

---

# 2. Human Decision Gate — obligatorio antes de crear el docs final

Antes de materializar el `docs/` completo, el agente MUST identificar cualquier decisión que pueda producir:

- arquitectura ambigua;
- lógica de negocio ambigua;
- dependencia externa desconocida;
- falta de permisos;
- falta de cuenta/servicio;
- falta de credenciales o secret reference;
- contrato externo incierto;
- auth no definida;
- tenancy no definida;
- storage/database no definido;
- deployment no definido;
- compliance no definido;
- monetización/pagos no definidos;
- retención/eliminación no definida;
- comportamiento irreversible no definido;
- bloqueo posterior de APPLY/REVIEW.

Todas esas dudas deben preguntarse al usuario **antes** de entregar el `docs/` final o el ZIP.

---

# 3. Cómo preguntar en Senior Mode

No preguntar una cosa por turno si puede resolverse en una sola ronda.

El agente debe:

1. inspeccionar primero toda la evidencia disponible;
2. eliminar preguntas ya respondidas por el proyecto;
3. agrupar preguntas restantes por categoría;
4. presentar opciones concretas;
5. incluir una opción recomendada cuando sea seguro hacerlo;
6. explicar brevemente por qué la recomienda;
7. marcar cuáles son realmente bloqueantes;
8. permitir respuesta compacta del usuario.

Formato recomendado:

```text
Q-001 — Tipo de autenticación
Estado: OPEN
Bloquea: identity, security, frontend auth flow
Opciones:
A. Email/password + refresh session
B. OIDC/OAuth2 externo
C. Magic link
Recomendación: B si ya existe IdP corporativo; A si el producto controlará identidad.
Necesito de ti: elegir A/B/C o indicar proveedor existente.
```

No usar ornamentación que rompa un parser machine-readable cuando `answers.md` sea consumido por tooling.

---

# 4. Nunca pedir secretos en claro

El agente MUST NOT pedir:

- passwords;
- API keys;
- private keys;
- access tokens;
- database passwords;
- production credentials;
- recovery codes.

Preguntar:

```text
¿El recurso existe?
¿Quién es el owner?
¿En qué secret manager/vault se almacenará?
¿Cuál será el nombre/ref lógico del secreto?
¿El runtime tendrá permiso para leerlo?
```

Ejemplo:

```text
Q-DB-003
¿Existe la cuenta PostgreSQL de producción?
A. Sí, ya provisionada.
B. No, crear por IaC.
C. No, provisioning manual posterior.

Secret value: NO SOLICITAR.
Secret reference esperada: preguntar solo nombre/ref lógico si ya existe.
```

---

# 5. Categorías obligatorias del Human Decision Gate

Preguntar SOLO lo que siga sin resolver.

## 5.1 Producto

- tipo de proyecto;
- objetivo;
- usuarios;
- problema principal;
- mercados/plataformas;
- MVP vs producto completo;
- features obligatorias;
- features fuera de scope;
- criterios de éxito;
- restricciones de plazo/coste cuando afecten arquitectura.

## 5.2 Arquitectura

- monolito/modular monolith/microservices cuando sea material;
- single repo vs multi-repo;
- sync vs async;
- realtime;
- offline;
- cloud/on-prem/hybrid;
- dependencia de servicios terceros;
- arquitectura existente que deba preservarse.

Si el usuario no tiene preferencia y no existe constraint, el agente puede ofrecer una recomendación Senior con trade-offs.

## 5.3 Datos

- base de datos;
- database engine;
- managed vs self-hosted;
- existencia de cuenta/cluster;
- entornos dev/staging/prod;
- data residency;
- backup/restore;
- seed data;
- fixtures;
- migration strategy;
- datos iniciales requeridos;
- importación/migración legacy.

No inventar credentials.

## 5.4 Autenticación e identidad

- anonymous vs authenticated;
- auth propia vs IdP;
- OAuth/OIDC/social;
- MFA;
- account recovery;
- roles/capabilities;
- admin/global admin;
- session/token model;
- SSO;
- device auth si aplica.

## 5.5 Multi-tenancy / ownership

Preguntar explícitamente cuando pueda aplicar:

```text
single-tenant
multi-tenant shared database
multi-tenant isolated schema/database
organization/workspace based
personal accounts only
```

También:

- tenant creation;
- invitation/membership;
- suspension;
- cross-tenant admin;
- data isolation;
- deletion/export.

No introducir `tenant_id` por una skill reusable.

## 5.6 Servicios externos

Para cada servicio:

- proveedor;
- cuenta existente;
- ambiente;
- owner;
- permisos;
- secret reference;
- quota;
- sandbox;
- webhook;
- callback/domain requirements;
- failure behavior.

Ejemplos:

- email;
- SMS;
- push;
- maps;
- storage;
- CDN;
- payment provider;
- analytics;
- search;
- AI provider;
- game backend;
- auth provider;
- monitoring;
- queues;
- object storage.

## 5.7 Permisos/IAM

- quién crea recursos;
- CI permissions;
- deploy permissions;
- runtime permissions;
- least privilege;
- service accounts;
- cloud roles;
- signing keys;
- app-store/play-store access;
- game platform credentials.

## 5.8 Seguridad/compliance

- PII;
- financial data;
- health data;
- children/minors;
- regulated data;
- encryption requirements;
- audit;
- retention;
- deletion;
- export;
- legal/compliance owner;
- geographic restrictions.

No inventar regulación.

## 5.9 Ambientes

Resolver:

```text
local
test
dev
preview
staging
production
```

solo los que realmente existirán.

Definir:

- config source;
- secrets;
- database strategy;
- external-service strategy;
- feature flags;
- seeders;
- test data;
- deploy flow.

## 5.10 Testing

- unit;
- integration;
- contract;
- E2E;
- UI;
- accessibility;
- performance;
- security;
- load;
- game simulation;
- device testing;
- offline testing;
- migration testing.

Preguntar por servicios/dispositivos reales necesarios si afectan la ejecución.

## 5.11 Delivery

- CI provider;
- artifact registry;
- hosting;
- domain/DNS;
- TLS;
- mobile stores;
- desktop signing;
- game stores/platforms;
- Docker/Rootless Podman Compose (VPS) / Kubernetes / serverless / VM / static hosting;
- IaC;
- deployment strategy;
- rollback.

### 5.11.1 Right-sizing de plataforma (FinOps Senior — 3 Tiers de referencia cuando aplica servidor)

No imponer Kubernetes ni AWS por defecto a proyectos simples o medianos. Cuando exista backend/infraestructura de servidor y el usuario pida recomendación, contrastar el Tier adecuado al volumen, compliance y equipo reales:

- **Tier 1 (`compose-vps` — Proyectos simples a medianos, cloud-neutral 1–3 VPS):** un único `compose.yaml` endurecido (Docker o Rootless Podman, no-root, redes internas aisladas sin puertos públicos de DB/cache, healthchecks y resource limits) + Caddy con TLS automático + PostgreSQL con backups cifrados PITR (`pgBackRest` / `pg_dump` hacia R2/B2/MinIO) + Valkey + automatización agnóstica opcional (Ansible). **Cero overhead de Kubernetes** (~85–90% de ahorro FinOps frente a EKS/Aurora).
- **Tier 2 (`k8s-gitops-selfhosted` — Empresa grande On-Prem / Soberanía de datos):** RKE2/K3s sin `kube-proxy`, Cilium eBPF + cifrado WireGuard, MetalLB + Gateway API, Argo CD + Argo Rollouts, Kyverno CEL (`ValidatingPolicy`/`ImageValidatingPolicy`), Tetragon eBPF runtime security y CloudNativePG + Barman Cloud PITR.
- **Tier 3 (`cloud-aws-gitops` — Empresa grande Cloud Público AWS):** AWS Organizations multi-cuenta, VPC 3-AZ + PrivateLink, CloudFront OAC + WAF, Cognito/Entra PKCE, EKS Pod Identity/IRSA, Aurora/Valkey, `Outbox -> SNS -> SQS + DLQ`, Terraform (`use_lockfile = true`) + Infracost + laboratorio local Floci.
- **Cliente puro / Desktop / CLI / Librería / Juego offline:** no inventar infraestructura de servidor, clusters ni bases de datos remotas innecesarias.

## 5.12 Observabilidad

- logging platform;
- metrics;
- tracing;
- crash reporting;
- frontend/mobile/game telemetry;
- alert destinations;
- on-call owner;
- SLO ownership.

No inventar porcentajes/thresholds.

## 5.13 Business rules

Preguntar toda regla que cambie:

- permisos;
- money;
- state transitions;
- irreversible actions;
- approvals;
- cancellation;
- refunds;
- settlement;
- scoring;
- matchmaking;
- inventory;
- subscriptions;
- entitlement;
- moderation;
- user-generated content;
- deletion;
- export;
- ranking;
- rewards;
- notifications;
- ownership.

## 5.14 Monetización/pagos

Si aplica:

- free/paid;
- subscription;
- one-time;
- marketplace;
- in-app purchases;
- store billing;
- taxes;
- refunds;
- currency;
- trial;
- entitlements;
- payment provider.

## 5.15 Mobile

Si aplica:

- iOS/Android;
- minimum OS;
- native/cross-platform;
- push;
- deep links;
- universal/app links;
- offline;
- background work;
- permissions;
- biometrics;
- secure storage;
- store accounts/signing;
- analytics/crash reporting.

## 5.16 Videojuegos

Si aplica:

- engine;
- target platforms;
- single-player/multiplayer;
- authoritative server;
- matchmaking;
- lobbies;
- persistence;
- saves/cloud saves;
- anti-cheat;
- inventory;
- economy;
- leaderboards;
- achievements;
- DLC/IAP;
- patch/update strategy;
- telemetry;
- dedicated servers;
- tick/network model;
- platform accounts;
- age/content rating.

## 5.17 Web

Si aplica:

- SPA/SSR/SSG;
- browser support;
- public/private pages;
- SEO;
- accessibility target;
- session model;
- CDN/cache;
- uploads;
- realtime;
- analytics;
- CSP/security headers;
- domain.

## 5.18 AI/Data

Si aplica:

- model/provider;
- data source;
- training vs inference;
- RAG;
- vector store;
- evaluation;
- prompt ownership;
- PII policy;
- human review;
- fallback;
- latency/cost constraints;
- model versioning.

---

# 6. Auto-recommendation policy

El agente puede recomendar una opción cuando:

- no cambia una regla de negocio humana;
- es reversible;
- tiene bajo riesgo;
- no afecta compliance;
- no crea coste material irreversible;
- no cambia data ownership;
- no introduce una dependencia estratégica no aprobada.

Si el usuario dice:

```text
usa las opciones recomendadas para todo lo no crítico
```

el agente puede cerrar decisiones técnicas reversibles con provenance.

No auto-resolver sin aprobación explícita:

- money semantics;
- legal/compliance;
- destructive retention;
- auth model materialmente ambiguo;
- multi-tenancy si afecta producto;
- irreversible lifecycle;
- billing/refunds;
- data residency;
- privileged approval flows;
- gameplay/economy rules materiales;
- business rules centrales.

---

# 7. answers.md gate

El `docs/rules/answers.md` es el registro de decisiones humanas.

Antes de generar el ZIP final:

```text
all_material_questions_resolved == true
```

Cada pregunta debe tener, como mínimo:

```text
Q-ID
Pregunta
Estado: OPEN | ANSWERED
Por qué importa
Opciones
Recomendación
Decisión
Provenance
Bloquea
Owners a sincronizar
Fecha
```

Si el Prompt Builder real usa una gramática más estricta, usar **esa gramática exacta**.

No envolver enum values en backticks si el parser no lo soporta.

No marcar `ANSWERED` sin aprobación humana o política de auto-recommendation explícitamente autorizada.

### Gramática machine-readable exacta para `@vigilio-services/prompt-builder@0.12.1`

Cuando el toolchain sea `@vigilio-services/prompt-builder`, `vigilio-prompt validate-decisions` parsea `docs/rules/answers.md` con estas reglas estrictas (`DECISION_REGISTER_INVALID` si fallan):

```markdown
## Q-001 — Modelo de autenticación y sesión
- Estado: ANSWERED
- Bloquea: identity.login, identity.users-store
- Por qué requiere decisión humana: Define cookies HttpOnly vs OIDC corporativo y afecta contratos web/API.
- Opciones: A) Email/password + cookies HttpOnly + rotación refresh | B) OIDC externo PKCE
- Recomendación: A para producto autónomo B2C; B si existe IdP corporativo.
- Decisión: A — Email/password con Argon2id, cookies HttpOnly/Secure/SameSite=Lax y rotación de refresh.
- Respondida por: Human approval (ronda inicial)
- Fecha de respuesta: 2026-11-02
- Owners/documentos sincronizados: docs/rules/00-global/security.md, docs/rules/01-modules/identity/README.md
```

Invariantes del parser `0.12.1`:
- Encabezado obligatorio nivel 2: `## Q-<ID> — <Título>` (IDs `Q-[A-Z0-9.-]+` únicos en todo el archivo; cero duplicados).
- Línea `- Estado: OPEN` o `- Estado: ANSWERED` (también acepta `Status:`), **sin backticks ni texto extra en esa línea**.
- Línea `- Bloquea: *` o lista de IDs `modulo.pack` o `none` (también acepta `Blocks:`).
- `EXPLORE` y `PROPOSE` permiten preguntas `OPEN` para descubrir y documentar propuestas; `APPLY`, `REVIEW` y `FIX` fallan cerrados (`BLOCKED_BEFORE_PUBLICATION`) si falta `answers.md` o cualquier `Q-*` aplicable permanece `OPEN`.

---

# 8. Regla de pre-ZIP

No entregar el ZIP final si existe una Q material `OPEN`.

Comportamiento:

```text
if material_open_questions:
    ask_user()
    do_not_publish_final_zip()
else:
    generate_docs()
```

Puede generarse un draft temporal interno, pero no presentarlo como final.

---

# 9. External resource readiness

Para evitar BLOCKED tardíos, antes del ZIP preguntar por recursos externos requeridos.

Para cada recurso clasificar:

```text
READY
TO_PROVISION_BY_IAC
TO_PROVISION_MANUALLY
NOT_REQUIRED
UNKNOWN
```

Ejemplos:

- DB cluster;
- object storage;
- email provider;
- payment account;
- push credentials;
- OAuth client;
- DNS;
- CDN;
- app store account;
- signing certificate;
- game platform credentials;
- AI provider;
- monitoring account.

`UNKNOWN` que pueda bloquear implementación debe convertirse en pregunta humana.

---

# 10. Project mode

Resolver:

```text
GREENFIELD
BROWNFIELD
MIGRATION
HYBRID
```

## GREENFIELD

La documentación puede diseñar arquitectura nueva dentro del scope aprobado.

## BROWNFIELD

Debe inspeccionar:

- repos;
- contracts;
- migrations;
- code;
- tests;
- deploy;
- current paths.

No describir TARGET como CURRENT.

## MIGRATION

Documentar:

- source;
- target;
- coexistence;
- compatibility;
- backfill;
- cutover;
- rollback/forward-fix.

## HYBRID

Separar claramente CURRENT/TARGET por superficie.

---

# 11. Prompt Builder compatibility — discover first

La skill debe ser compatible con Prompt Builder, pero NO hardcodear una versión.

Antes de generar manifests/plans:

1. detectar package instalado;
2. obtener versión;
3. obtener runtime requerido;
4. ejecutar/leer `--help`;
5. localizar schemas;
6. localizar templates;
7. descubrir rules-root;
8. descubrir registry path semantics;
9. descubrir plan schema;
10. descubrir decision parser;
11. descubrir scanner/template behavior;
12. descubrir migration command.

Si Prompt Builder no está instalado:

```text
CLI compatibility: NOT_EXECUTED
```

No fingir `CLI_PASS`.

---

# 12. Prompt Builder compatibility levels

Reportar:

```text
STRUCTURAL_PASS
SCHEMA_PASS
RESOLVER_PASS
CLI_PASS
PROJECT_PASS
PUBLICATION_READY
```

Significados:

- `STRUCTURAL_PASS`: files/inventory/YAML/Markdown correctos.
- `SCHEMA_PASS`: schemas reales pasan.
- `RESOLVER_PASS`: registry/paths/DAG/plans resuelven.
- `CLI_PASS`: validators reales del CLI pasan.
- `PROJECT_PASS`: además resuelve contra repos/contracts/runtime reales.
- `PUBLICATION_READY`: locks, eligibility, decisions y gates de publicación pasan.

Nunca decir “100% compatible” indicando solo `STRUCTURAL_PASS`.

---

# 13. Prompt Builder safety rules

Cuando aplique:

- manifests usan schema actual;
- registry usa schema actual;
- registry paths son relativos al root que el resolver realmente usa;
- IDs respetan regex real;
- no hay duplicate IDs/paths;
- plans usan schema actual;
- dependency refs existen;
- DAG es acíclico;
- decision register usa parser grammar real;
- templates no contaminan product scanning;
- `additionalProperties:false` se respeta;
- target profile valida;
- allowed paths resuelven;
- locks se verifican;
- generated artifacts no se editan manualmente.

---

# 14. Templates y scanners

Los templates son scaffolds, no producto.

Si un scanner encuentra todo archivo llamado `prompt-pack.yaml`, no dejar placeholders inválidos como:

```text
module.<module>
```

Usar el mecanismo soportado por el toolchain:

- exclude path;
- template extension;
- template marker;
- scan root separado.

No inventar un ID falso que convierta el template en pack real.

---

# 15. Migración de schema

Si existe migrator oficial:

```text
backup
→ migrate
→ inspect diff
→ validate
```

No reimplementar manualmente una migración que el CLI ya soporta.

Migration no implica:

- business approval;
- runtime readiness;
- feature completion.

---

# 16. Arquitectura base de docs/

La arquitectura exacta se adapta al proyecto, pero el blueprint recomendado es:

```text
docs/
├── README.md
├── PROJECT-SUMMARY.md
├── input/
│   └── existing-system.md              # brownfield/migration
├── plans/
│   ├── full-project.yaml
│   └── first-vertical-slice.yaml
└── rules/
    ├── project-brief.md
    ├── answers.md
    ├── factory-baseline.yaml
    ├── registry.yaml
    ├── target-profiles.yaml
    ├── 00-global/
    ├── 01-modules/
    ├── 02-workflows/
    ├── 03-adr/
    ├── 04-runbooks/
    ├── 05-reference/
    └── 99-templates/
```

Crear solo superficies aplicables al proyecto, excepto archivos que el manifest/toolchain exija físicamente.

## 16.1 Separación obligatoria: fuente, derivados y estado operativo

La factory debe mantener tres superficies distintas. No mezclarlas ni usar una como sustituto de otra:

| Superficie | Autoridad | Contenido | Edición | Git |
|---|---|---|---|---|
| `docs/` | fuente canónica | decisiones, owners, reglas, packs, planes y perfiles | humana/agente con review | sí |
| `generated/` | derivado reproducible | prompts, locks y `execution-plan.json` | solo Prompt Builder | normalmente no |
| `.prompt-runner/senior/` | estado operativo | leases, intentos, heartbeat, cancelación, resultados y eventos | solo coordinador/worker protocol | no |

Reglas:

- una corrección semántica se realiza en `docs/` y luego se regenera;
- nunca reparar un prompt, lock o plan editando `generated/` manualmente;
- eliminar `generated/` no debe eliminar decisiones ni documentación canónica;
- eliminar `.prompt-runner/senior/` elimina historial de ejecución, no la definición del producto;
- no copiar tokens, passwords, outputs sensibles ni logs completos a ninguna de estas superficies;
- el `.gitignore` del consumidor debe excluir los derivados y el estado operativo cuando esa sea la
  política declarada del proyecto;
- OpenSpec y cualquier memoria durable aprobada se conservan como fuente versionada fuera del estado
  efímero del runner.

El flujo de autoridad es unidireccional:

```text
human decisions + repository evidence
                ↓
              docs/
                ↓ Prompt Builder validate/build
            generated/
                ↓ Senior Mode coordinator
      .prompt-runner/senior/
                ↓ verified commits + evidence
        implementation repositories
```

El resultado de ejecución puede revelar una inconsistencia documental. En ese caso se abre un cambio
explícito en la fuente; nunca se promueve automáticamente el estado del runner a verdad de producto.

---

# 17. docs/README.md

Debe ser breve.

Función:

- cómo navegar docs;
- autoridad;
- estructura;
- CURRENT/TARGET/GAP;
- flujo de cambios;
- links a `PROJECT-SUMMARY.md`, brief, architecture, modules, workflows, ADRs y runbooks.

No convertirlo en mega-documento.

---

# 18. docs/PROJECT-SUMMARY.md — obligatorio

Este es el resumen compacto final del proyecto.

Debe permitir que una IA o engineer entienda **qué se debe construir al final** sin cargar todo `docs/`.

No sustituye los owners detallados.

Debe contener:

## Identity

```text
Project name
Project type
Project mode
Primary goal
Target platforms
Status
```

## Final product outcome

Qué podrá hacer el producto cuando esté completo.

## Users / actors

Lista compacta de actores.

## Architecture snapshot

- frontend;
- backend;
- mobile/game clients;
- services;
- databases;
- storage;
- async;
- realtime;
- infrastructure;
- repos/apps.

## Authentication & authorization

- auth type;
- IdP;
- session/token;
- MFA;
- RBAC/capabilities;
- recovery;
- admin model.

## Tenancy / ownership

- single/multi tenant;
- organization/workspace/account model;
- isolation;
- cross-scope admin.

## Modules/features

Tabla compacta:

```text
module | responsibility | main capabilities | owner
```

## Endpoint inventory

Resumen de endpoints que deben existir:

```text
method | route/operation | purpose | auth | module
```

Solo IDs/routes aprobados por owners.

El schema exacto permanece en `endpoints.md`/contract owner.

## Pages/screens inventory

Para web/mobile/desktop/game UI:

```text
route/screen | purpose | actor | auth | module
```

## Jobs/events/realtime

Resumen:

```text
producer | event/job | consumer | purpose | runtime state
```

## Data model snapshot

- stores;
- main aggregates/entities;
- ownership;
- critical constraints;
- money rules si aplica.

## Seeders / fixtures

Debe indicar:

- qué seeders existirán;
- para qué environment;
- qué datos son synthetic;
- qué NO debe cargarse en production;
- bootstrap admin strategy;
- game/catalog/reference seed data;
- test fixtures.

No incluir secrets.

## External integrations

```text
service | purpose | account readiness | secret ref | environments
```

## Development environment

Resultado esperado:

- required runtimes;
- install;
- local dependencies;
- DB;
- migrations;
- seed;
- start commands;
- test commands;
- mock/sandbox services;
- local auth strategy;
- dev URLs si son owners reales.

## Production environment

Resumen esperado:

- runtime;
- deploy unit;
- database;
- storage;
- CDN;
- domains;
- TLS;
- secret source;
- monitoring;
- backup/restore;
- migrations;
- rollback/forward-fix;
- scaling strategy;
- app/game stores si aplica.

## Testing matrix

Resumen:

```text
unit
integration
contract
security
concurrency
E2E
UI
accessibility
performance
device/platform
migration
failure/recovery
```

## CI/CD gates

Qué debe pasar antes de merge/deploy.

## Observability

- logs;
- metrics;
- traces;
- crash reporting;
- audit;
- alerts;
- dashboards.

## Security summary

- main boundaries;
- secrets;
- sensitive data;
- authorization;
- encryption;
- audit;
- dependency/supply chain.

## Dev-complete definition

Qué debe funcionar para considerar desarrollo local completo.

## Production-ready definition

Qué debe existir/pasar para producción.

## Final acceptance snapshot

Checklist textual compacto:

```text
APIs implemented
Pages/screens implemented
Auth implemented
Data/migrations implemented
Seeders implemented
Integrations wired
Tests green
Security gates green
Observability live
Runbooks ready
Deploy validated
Rollback/recovery validated
No material OPEN decisions
```

## Remaining external prerequisites

Solo si existen:

```text
resource
owner
state
activation action
```

Si alguno es material y aún `UNKNOWN`, no publicar ZIP final sin preguntar primero.

---

# 19. project-brief.md

Debe definir:

- problem;
- outcome;
- actors;
- scope;
- out of scope;
- platforms;
- critical workflows;
- business constraints;
- security/compliance;
- NFR;
- integrations;
- acceptance;
- risks;
- glossary.

No duplicar implementation detail.

---

# 20. 00-global/

Crear global docs según applicability.

Ejemplos posibles:

```text
constitution.md
architecture.md
context-map.md
security.md
observability.md
quality.md
delivery.md
data-migrations.md
compatibility-versioning.md
error-handling.md
data-classification.md
audit-policy.md
retention-deletion.md
background-jobs.md
threat-model.md
slo-error-budget.md
operational-readiness.md
openspec-integration.md
ui/**
mobile/**
game/**
data/**
ai/**
```

No crear una tecnología global solo porque exista una skill para ella.

---

# 21. Modules

Cada bounded context/module material debe poder documentar:

```text
prompt-pack
README
design
domain/data model
operations
use-cases
```

README:

- responsibility;
- owns;
- does-not-own;
- public interfaces;
- dependencies;
- capabilities;
- actor/scope;
- owner.

Design:

- layers;
- dependency direction;
- application/domain/adapters;
- transaction boundaries;
- integrations;
- error boundaries;
- security;
- observability;
- evolution.

Domain/data:

- aggregate/entity/value objects;
- fields;
- ownership;
- constraints;
- indexes if canonical;
- states;
- concurrency;
- audit;
- retention;
- migration.

---

# 22. Use case depth

Cada use case debe poder implementarse sin adivinar.

Según el proyecto, usar artifacts como:

```text
prompt-pack.yaml
class.md / data.md
business.md
endpoints.md / interface.md
pages.md / screens.md
events.md
tests.md
operations.md
```

El naming debe adaptarse al manifest/toolchain.

---

# 23. business.md

Cubrir:

- purpose;
- actors;
- authorization;
- scope/ownership;
- preconditions;
- rules;
- invariants;
- exact ordered flow;
- transaction;
- state;
- concurrency;
- idempotency;
- failures;
- ambiguous outcomes;
- postconditions;
- side effects;
- security;
- audit;
- observability;
- recovery/compensation;
- edge cases.

No “seguir política estándar” sin explicar implicación concreta.

---

# 24. endpoints/interface contract

Cuando API/IPC aplica:

- operation owner;
- transport;
- method/route if approved;
- auth;
- params;
- query;
- request;
- response;
- errors;
- pagination;
- concurrency/conflict;
- idempotency;
- upload/download;
- rate limit only if owned;
- sensitive data;
- observability;
- tests.

Si este archivo es owner del target contract, no escribir solo “schema por definir”.

---

# 25. pages/screens

Cuando UI aplica:

- lifecycle;
- route/screen;
- navigation;
- actors;
- auth;
- layout;
- components;
- data;
- actions;
- loading;
- empty;
- validation;
- success;
- forbidden;
- unauthenticated;
- not found;
- conflict;
- degraded;
- stale;
- ambiguous mutation;
- retry/offline where relevant;
- responsive;
- accessibility;
- testing;
- telemetry;
- security.

Si runtime UI no aplica pero archivo físico es requerido, crear resolution record completo `NOT_APPLICABLE`.

---

# 26. events/jobs/realtime

Cuando aplica:

- owner;
- producer;
- consumer;
- schema;
- version;
- delivery;
- ordering;
- duplicates;
- idempotency;
- transaction/outbox if real;
- retry classes;
- DLQ if real;
- replay;
- security;
- observability;
- testing.

Si no aplica, no inventar EVT/queue/topic.

---

# 27. tests.md

Distinguir:

```text
unit
integration
contract
security
concurrency
idempotency
E2E
UI
accessibility
performance
migration
failure injection
recovery
platform/device/game simulation
```

Evidence states:

```text
PASS
FAIL
BLOCKED
NOT_EXECUTED
NOT_APPLICABLE
```

No convertir mock test en integración real.

---

# 28. operations.md

Cubrir:

- operational scope;
- dependencies;
- failures;
- degraded behavior;
- SLI semantics;
- SLO owner;
- metrics semantics;
- alerts;
- dashboard;
- runbook;
- capacity dimensions;
- backpressure;
- concurrency;
- ambiguous outcomes;
- recovery;
- DR;
- rollback/forward-fix;
- security incident considerations;
- telemetry validation.

No inventar thresholds.

---

# 29. Workflow docs

Por workflow:

- purpose;
- actors;
- participants;
- sequence;
- inputs/outputs;
- state transitions;
- transaction boundaries;
- consistency;
- partial failure;
- compensation;
- retry/replay;
- security;
- audit;
- observability;
- tests;
- operations;
- recovery.

---

# 30. ADRs

Crear ADR solo para decisiones duraderas.

Formato:

```text
Status
Context
Decision
Drivers
Alternatives
Consequences
Trade-offs
Security/data impact
Migration
Rollback/reversal
Evidence
```

---

# 31. Runbooks

Por riesgo operacional:

```text
Trigger
Symptoms
Severity
Impact
Safety constraints
Diagnosis
Evidence
Containment
Remediation
Retry/replay safety
Verification
Rollback/forward-fix
Escalation
Owner
Post-incident
```

---

# 32. References/catalogs

Crear solo catalogs con valor transversal.

Ejemplos:

- permission matrix;
- ownership matrix;
- state machines;
- endpoint catalog;
- screen/page catalog;
- event catalog;
- queue/job catalog;
- error catalog;
- SLO catalog;
- dashboard catalog;
- data classification;
- integration catalog;
- environment catalog;
- traceability matrix.

No duplicar la regla fuente.

---

# 33. Compact-complete policy

El `docs/` debe ser completo, pero no inflado.

Usar:

```text
ONE RULE
→ ONE OWNER
→ references elsewhere
```

Cada archivo debe contener todas las **implicaciones target-specific**, pero no copiar páginas enteras de reglas globales.

Evitar:

- repeated boilerplate;
- copy/paste de políticas;
- dumps de source code;
- tutoriales;
- explicaciones básicas que una skill ya resuelve.

Priorizar:

```text
decisions
contracts
invariants
boundaries
edge cases
evidence
```

---

# 34. Context-budget strategy

El agente debe producir docs profundos sin obligar a cargar todo el proyecto en cada prompt.

Usar progressive disclosure:

```text
PROJECT-SUMMARY
+ relevant global owners
+ module owner
+ current use case
+ required references
+ applicable skills
```

No:

```text
entire docs/
+ all skills
+ all modules
```

para cada task.

Prompt packs deben declarar exactamente el contexto necesario.

---

# 35. Source absence behavior

Si falta una fuente:

- no inventar;
- conservar lo conocido;
- preguntar si la ausencia implica decisión humana;
- usar GAP/TARGET cuando sea evidencia aún no materializada;
- usar BLOCKED solo si realmente impide continuar.

Antes del ZIP final, toda ausencia **decisional** material debe haberse preguntado.

---

# 36. Full-depth no-compression

Cada target se trata como si fuera solicitado solo.

Prohibido:

- “same as above”;
- “igual al anterior”;
- “aplica estándar” sin implicación local;
- “etc.” cuando omite requisitos;
- placeholders;
- archivos N/A triviales;
- files de 3 líneas para gaps importantes;
- reducir profundidad por batch.

---

# 37. Edge-case minimum

Para capabilities aplicables revisar:

- empty input;
- malformed input;
- duplicates;
- concurrent request;
- stale state;
- completed state;
- forbidden transition;
- auth change mid-flow;
- timeout before commit;
- timeout after commit;
- ambiguous result;
- downstream failure;
- retry;
- replay;
- deleted/disabled resource;
- time boundary;
- pagination;
- large dataset;
- crash/restart;
- telemetry failure;
- audit failure;
- recovery.

---

# 38. Domain profiles

Activar solo si aplica.

## Financial

- exact money;
- currency;
- rounding authority;
- tolerance;
- immutable history;
- approvals;
- correction/compensation;
- ambiguous commit;
- deterministic reconciliation;
- settlement/close.

## Healthcare/regulated

- sensitive data;
- consent;
- minimum access;
- retention;
- audit;
- data export;
- jurisdictional owners.

## Games

- authoritative state;
- anti-cheat;
- economy;
- inventory;
- save consistency;
- matchmaking;
- disconnect/reconnect;
- patch compatibility;
- platform entitlements.

## Mobile

- offline;
- background;
- device permissions;
- deep links;
- push;
- secure storage;
- store/signing;
- version compatibility.

## AI

- data provenance;
- model/version;
- evaluation;
- safety;
- human review;
- cost/latency;
- PII;
- fallback.

---

# 39. Cross-file synchronization

Después de generar, sincronizar:

```text
answers
↔ project brief
↔ global owners
↔ modules
↔ use cases
↔ workflows
↔ ADRs
↔ references
↔ registry
↔ prompt packs
↔ plans
↔ target profiles
↔ PROJECT-SUMMARY
```

Una decisión no está cerrada si solo existe en `answers.md` pero sus owners siguen contradiciéndola.

---

# 40. Manifest/registry/plan invariants

Cuando existan:

```text
registry product IDs
==
materialized product pack IDs

registry paths
==
real manifest paths

plan refs
⊆
registry IDs

depends_on refs
⊆
registry IDs

DAG is acyclic
```

Templates no son product packs salvo que el toolchain lo modele explícitamente.

---

# 41. Mechanical validation

Antes del ZIP:

- expected inventory == actual inventory;
- missing == 0;
- unauthorized extras == 0;
- empty == 0;
- YAML/JSON parse;
- duplicate YAML keys rejected;
- schemas pass;
- registry IDs/paths valid;
- path roots resolve;
- no duplicated prefix;
- plan schema valid;
- plan dependency closure valid;
- decisions parser valid;
- IDs valid;
- templates isolated;
- placeholders == 0;
- Markdown fences balanced;
- protected/generated areas respected;
- hashes verified where required.

---

# 42. Real CLI validation

Un custom validator es solo preflight.

Si el toolchain real está disponible:

```text
run real validator
→ capture error
→ fix owner
→ rerun exact validator
→ rerun broader gate
```

Nunca:

```text
write easier validator
→ pass own validator
→ claim compatibility
```

---

# 43. Prompt Builder gate sequence

Usar los nombres exactos soportados por la versión descubierta.

Secuencia conceptual:

```text
migrate if required
→ validate references
→ validate decisions
→ validate packs/schemas
→ check eligibility
→ plan
→ build/build-all dry-run
→ create/verify locks
→ publication gates
```

Si un comando no existe en esa versión, no inventarlo.

Secuencia exacta de referencia cuando `@vigilio-services/prompt-builder@0.12.1` (y opcionalmente `@vigilio-services/vigilio-skills@0.8.3`) están instalados en el proyecto:

```bash
# 0. Descubrir versiones reales instaladas
pnpm exec vigilio-prompt --version
pnpm exec vigilio-prompt --help

# 1. Validar sincronización de skills y contexto de plataforma (si aplica vigilio-skills)
pnpm exec vigilio-skills check --target .agents/skills
pnpm exec vigilio-skills context

# 2. Validar referencias OpenSpec -> docs/rules y cierre de decisiones humanas
pnpm exec vigilio-prompt validate-references --project-root .
pnpm exec vigilio-prompt validate-decisions --project-root .

# 3. Validar cada pack, elegibilidad y grafo completo de ejecución sin escribir archivos
pnpm exec vigilio-prompt check-eligibility --project-root . --phases propose,apply,review
pnpm exec vigilio-prompt plan --project-root . --phases propose,apply,review
pnpm exec vigilio-prompt build-all --project-root . --phases propose,apply,review --dry-run

# 4. Compilar snapshot atómico determinista y verificar integridad de locks
pnpm exec vigilio-prompt build-all --project-root . --phases propose,apply,review
pnpm exec vigilio-prompt verify-lock --project-root . --lock-file <generated-lock-file>
```

---

# 44. Zero-BLOCKED strategy

Objetivo:

```text
zero artificial blockers
```

Proceso:

1. preguntar decisiones humanas temprano;
2. elegir default recomendado solo cuando esté autorizado;
3. crear missing files/directories dentro del scope;
4. provisionar por IaC si fue decidido;
5. convertir external-resource absence en plan de provisioning, no sorpresa;
6. validar antes de APPLY;
7. preservar blockers reales.

Nunca esconder:

- missing human approval;
- missing mandatory credential/resource;
- contract mismatch;
- failed security gate;
- failed data invariant;
- failed CLI/schema validation.

---

# 44.1 Prompt Builder + Senior Mode — contrato operativo actual

Cuando `docs/` alimente `PROPOSE`, `APPLY` y `REVIEW`, el contrato de generación y ejecución es
obligatorio. La automatización visual, Antigravity, OpenCode u otro backend son adaptadores; la fuente,
el plan y la máquina de estados conservan la misma semántica.

## Resumen corto: `docs/` → Prompt Builder → launcher Python

```text
docs/ (fuente canónica)
  → Prompt Builder valida y compila
generated/ (prompts + locks + execution-plan.json)
  → senior_agent_launcher.py coordina hasta N trabajos seguros
.prompt-runner/senior/ (estado, heartbeat, resultados y reintentos)
```

Para que funcione correctamente:

1. `docs/` debe contener decisiones cerradas, owners, contratos, reglas y tests verificables. Cada
   `prompt-pack.yaml` ejecutable usa un ID estable, schema soportado, dependencias explícitas, scope
   `allowed_paths`/`forbidden_paths`, quality gates y una responsabilidad pequeña.
2. En schema v3, declarar claims exactos por fase cuando sea posible. Paths o recursos compartidos
   (`database`, puerto, lockfile, navegador, emulador) deben solaparse o usar el mismo
   `exclusive_resource` para que el scheduler los serialice. APPLY/FIX sin claims usa todos sus
   `allowed_paths` como write-set conservador; PROPOSE/REVIEW sin claims permanece serial.
3. Prompt Builder es el único que escribe `generated/`. Nunca editar manualmente prompts, locks ni
   `execution-plan.json`; corregir `docs/` y regenerar. No regenerar durante una corrida activa, porque
   un fingerprint distinto no puede reutilizar el historial anterior sin migración explícita.
4. `senior_agent_launcher.py --workers N` ejecuta o renueva el preflight configurado y después abre hasta
   N sesiones independientes. En `--visual-tabs`, usa un navegador, un `DISPLAY` y una tab fija por
   worker: los envíos usan el cursor de forma secuencial, pero las respuestas se generan simultáneamente.
5. Cada intento `dedicated-worktree` trabaja aislado y entrega `heartbeat.json` y un `result.json`
   inmutable. El supervisor Python es el único escritor de `state.json`; por defecto, cada 15 segundos
   valida identidades, hashes, claims, commit, timeout y retry. La interfaz visual no decide el estado.
6. Los resultados listos se integran en subolas sin conflictos, se ejecutan los checks configurados y
   solo entonces se libera trabajo solapado o la fase siguiente. La barrera sigue siendo
   `PROPOSE → APPLY → REVIEW`; `--workers 1` conserva el flujo secuencial anterior.
7. Si se cierra el terminal, volver a ejecutar el launcher con el mismo proyecto, plan y argumentos.
   El coordinador relee `.prompt-runner/senior/`, conserva los `done`, recupera la transacción Git
   compatible y reintenta únicamente lo pendiente o fallido dentro del límite configurado.

Regla práctica: versionar `docs/`; tratar `generated/` como derivado reproducible y
`.prompt-runner/senior/` como estado local efímero. Durante una corrida, no borrar ninguno de los dos
últimos ni cambiar los documentos que formaron sus hashes.

## Prompt Builder actual

El contrato de referencia de esta revisión es Prompt Builder `0.12.1` (`@vigilio-services/prompt-builder@0.12.1`), pero la versión instalada debe
descubrirse en runtime y prevalece sobre esta nota. Para el toolchain que soporte execution-plan schema
v3 y las mejoras `0.12.1`:

- Prompt Builder compila `docs/`; no reemplaza decisiones humanas ni owners canónicos;
- schema v2 continúa siendo compatible y se ejecuta de forma serial;
- schema v3 puede declarar concurrencia mediante resource claims;
- la ausencia parcial o total de claims en schema v3 APPLY/FIX activa un fallback conservador: todos
  los `allowed_paths` resueltos se consideran write claims; puede serializar de más, nunca de menos;
- `strategy: serial` explícito siempre prevalece; PROPOSE/REVIEW sin claims y todo schema v2 continúan
  seriales;
- `allowed_paths` sigue siendo la frontera de autorización aunque APPLY/FIX pueda reutilizarla como
  write-set conservador;
- `read_paths`, `write_paths` y `exclusive_resources` deben ser mínimos, exactos y project-relative;
- paths absolutos, traversal, `**` global y claims fuera del scope fallan cerrados;
- `target-profiles.yaml` (`0.12.1+`) soporta perfiles **Zero-`contracts/`** (`contract` omitido o `mode: openapi | none`) sin exigir manifiestos globales `packages/contracts/package.json`; `mode: package` se conserva solo para brownfield multi-repo que ya publique físicamente un paquete de contratos;
- la validación de `target-profiles.yaml` es consciente de la fase: `explore` y `propose` corren en modo `discovery` (apps o specs aún no materializados generan `preflight_warnings` para registrar en tareas), mientras que `apply`, `review` y `fix` corren en modo `strict` y fallan cerrados;
- `build-all` publica un snapshot atómico protegido del directorio generado (elimina prompts/locks huérfanos propios, rechaza reemplazar directorios con archivos ajenos y restaura el snapshot previo si falla el swap);
- el build genera prompts ordenados, locks portables LF/CRLF y un `execution-plan.json` determinista;
- `plan_fingerprint` identifica el contenido semántico del plan y evita reusar historial obsoleto;
- cambiar `docs/`, prompts o locks requiere regenerar y produce una identidad de plan nueva cuando
  cambia la semántica;
- el runner Senior Mode (`0.12.1+`) acota el disco removiendo worktrees inactivos tras completar, fallar o ser reemplazados (preservando historial JSON, patches compactos y refs Git recuperables ante fallos de integración) y endurece la recuperación de sesiones visuales estancadas.

Cada step schema v3 debe exponer como mínimo:

```text
step_id
sequence
pack
phase
phase_wave
prerequisite_step_ids
concurrency
prompt + prompt_sha256
lockfile + lock_sha256
execution_status
```

La numeración `0001`, `0002`, `0003` se deriva del plan y su orden topológico. No se escribe a mano en
`docs/`. Para obtener prompts pequeños, dividir el dominio en packs/use cases cohesivos y planes
verticales; no cortar arbitrariamente un contrato o transacción solo para reducir tokens.

## Forma requerida de cada prompt pack

Cada pack ejecutable debe tener:

- un ID estable y único;
- una responsabilidad implementable y revisable;
- dependencias explícitas y acíclicas;
- owners y fuentes canónicas identificados;
- `allowed_paths` y `forbidden_paths` reales;
- quality gates objetivos;
- activation gates/requirements cuando apliquen;
- target profile válido;
- metadata de concurrencia explícita y completa cuando sea posible; de lo contrario, aceptar
  conscientemente el fallback conservador APPLY/FIX o declarar estrategia serial;
- alcance suficientemente pequeño para producir un commit coherente;
- criterios que permitan distinguir `PASS`, `FAILED`, `BLOCKED` y `NOT_EXECUTED`.

No crear un mega-pack `full-project` con toda la implementación dentro. `full-project` puede ser el
plan, pero sus steps deben seguir siendo packs pequeños con dependencia y ownership claros.

## Preflight central antes de otorgar leases

Antes de otorgar una lease, ejecutar el preflight configurado y fijarlo al `plan_fingerprint` y al Git
base SHA actuales. Debe comprobar, según la policy declarada:

- toolchain, runtime y Prompt Builder compatibles;
- repositorios, archivos y contratos requeridos;
- estado Git apto para la estrategia de worktrees/commits;
- permisos efectivos de lectura/escritura mediante probes temporales eliminados;
- servicios requeridos: database, Docker o Rootless Podman (`docker info` / `podman info`), Redis/Valkey, queues, emulators o índices auxiliares;
- cuentas, permisos y secret references, sin leer ni registrar valores secretos;
- commands de test/build/lint/typecheck y assets requeridos por el backend.

Si cambia el base SHA por una integración o cambia el fingerprint, el preflight anterior queda stale y
el launcher lo vuelve a ejecutar antes de otorgar otra lease. No descubrir una database apagada o una
credencial inexistente durante APPLY si podía comprobarse antes.

## Identidad, estado y protocolo por prompt

Cada trabajo tiene identidad estable y cada intento tiene identidad efímera:

```text
job_id      = <pack>:<phase>
attempt_id  = attempt-0001, attempt-0002, ...
lease_token = secreto efímero del intento
worker_id   = backend/session asignado
```

El coordinador es el único escritor de `state.json` y `events.jsonl`. Los workers nunca deciden por sí
solos qué prompt sigue ni editan el estado global. Solo intercambian archivos attempt-scoped:

```text
.prompt-runner/senior/<plan>/jobs/<job>/attempt-0001/
├── request.json
├── heartbeat.json
├── progress.json
├── commands/<command-id>.json
├── agent-prompt.md
├── session.json
├── cancel.json       # solo cuando el supervisor solicita cancelación
└── result.json
```

`request.json` fija job, attempt, lease, base SHA, hashes del prompt/lock, paths de salida, resource
claims y contrato de terminal. `result.json` debe repetir esas identidades; un resultado stale o de
otro intento se rechaza aunque diga `PASS`.

Estados conceptuales:

```text
pending → leased → running → produced → validated → done
                    ├──────→ blocked
                    ├──────→ failed
                    └──────→ stalled → pending | failed
```

Un `PASS` mutante requiere exactamente un commit, changed-files dentro de claims y checks objetivos con
exit code cero. Un `REVIEW` usa `result_mode=audit`: no modifica ni commitea archivos, informa el
`base_sha` arrendado como `result_commit`, entrega `changed_files=[]`, mantiene limpio el workspace y
aporta checks objetivos, `summary` y evidencia estructurada. La integración valida el contrato
correspondiente antes de marcar `done`.

## Workers y barreras de fase

- `--workers 1` conserva el flujo histórico prompt por prompt;
- `--workers N` expresa capacidad máxima dinámica (límite de seguridad de referencia: 64), no obligación
  de llenar todos los slots; comenzar normalmente con 2..6 y subir solo con evidencia;
- cada lease se entrega a una invocación independiente del adapter; esa invocación debe abrir un chat o
  sesión nueva, consumir su propio prompt y permanecer attached hasta producir resultado;
- el launcher persiste la membresía de la cohorte vertical y, por defecto, usa `cohort-size = workers`:
  completa los N PROPOSE, luego los N APPLY y después los N REVIEW antes de seleccionar otros packs;
- nunca puede haber más workers activos que la capacidad declarada;
- una cohorte puede contener jobs que se solapan, pero el scheduler solo ejecuta simultáneamente el
  subconjunto sin dependencias ni conflictos;
- writes solapados, shared-worktree writable o recursos exclusivos iguales forman subolas seriales;
- todos los `PROPOSE` de la cohorte activa deben terminar antes de habilitar sus `APPLY`;
- todos los `APPLY` de la cohorte activa deben terminar e integrarse antes de habilitar sus `REVIEW`;
- un fallo individual no repite siblings `done`; un check combinado sin causa atribuible reintenta la
  subola afectada, no trabajos de subolas anteriores;
- los commits terminados se integran en subolas conflict-free y orden determinista; eso libera el lock
  lógico para que el siguiente APPLY solapado pueda arrancar sin esperar eternamente;
- la integración se registra como transacción reanudable; después de un cierre, el supervisor compara
  el árbol Git esperado antes de continuar y falla cerrado si no coincide;
- un conflicto vuelve a validación/reparación. Si un check combinado no permite atribuir la culpa con
  certeza, falla la subola completa en lugar de acusar arbitrariamente al último commit.

No usar elementos visuales ni visibilidad de chats como fuente de verdad. En `--visual-tabs`, cada chat
escribe su `result.json`; el coordinador valida identidades, commit y diff, integra cada subola lista en
orden determinista y ejecuta checks sobre el conjunto integrado antes de habilitar trabajo solapado o la
siguiente fase.

El paralelismo visual recomendado usa un solo `DISPLAY`, una ventana de navegador dedicada y una tab fija
por worker. Un controlador único serializa clics, paste y Enter; después de cada envío las respuestas
generan concurrentemente en segundo plano. Antes de iniciar, enfocar una ventana autenticada que contenga
exactamente una tab. El controlador duplica esa tab, crea las restantes y reutiliza sus posiciones; se
soportan hasta ocho. No navega a `chatgpt.com`, no presupone una URL y no usa scraping, Selenium,
Playwright ni otro navegador adicional. Después usa los assets visuales existentes para New Chat,
composer/search, paste y Enter.

El ROI horizontal del composer/search no debe fijarse únicamente a un porcentaje de pantalla. El driver
parte del límite seguro de la pane izquierda/derecha, pero lo expande dinámicamente hasta contener el
rectángulo completo del asset detectado más un margen proporcional (2%, acotado entre 8 y 48 px). Así,
resoluciones estrechas como 1024x768 no cortan por uno o dos píxeles un template ancho. Con
`--chat-pane auto`, si todavía no existe un anchor válido, la búsqueda inicial usa el ancho completo;
después conserva el pane observado sin volverlo a estrechar. El ROI de estados permanece separado y
acotado para no confundir iconos o texto de una terminal vecina con estados del agente.

Comando Linux de referencia para cuatro tabs:

```bash
python3 senior_agent_launcher.py \
  --project-root "$PROJECT_ROOT" \
  --prompts-dir "$PROJECT_ROOT/generated/prompts/full-project" \
  --workers 4 --cohort-size 4 \
  --check-every-seconds 15 \
  --heartbeat-timeout-seconds 600 --stall-grace-seconds 30 --max-retries 2 \
  --preflight-command-json '["bash","scripts/preflight-env.sh"]' \
  --integration-check-json '["pnpm","test"]' \
  --visual-tabs --linux \
  --display :1 \
  --ui-module ./chatgpt_docs_automation.py --assets ./opencode-assets \
  --chat-pane auto --keepalive-click --keepalive-interval-seconds 30 \
  --response-timeout-seconds 5400 --send-with-enter --new-chat-mode each \
  --automation --auto-apply-recommended --retry-blocked --retry-interrupted \
  --include-context-only
```

`--preflight-command-json` evita iniciar la cohorte con runtime, servicios o credenciales operativas no
listos. `--integration-check-json` es repetible y corre solo cuando una subola terminada ya fue
integrada; no se lanzan tests globales mientras otros workers todavía escriben sus commits.

## Supervisor y terminales administradas

Senior Mode ejecuta un watchdog central (`supervise`) que revisa todos los IDs a intervalo corto. No
lee el texto del prompt para adivinar si existe un bloqueo: observa lease, heartbeat, intento y procesos
registrados. En cada poll emite una línea `supervisor.tick` con conteos por estado, sesiones activas,
jobs en espera, blockers y errores; si se cierra el terminal se detiene el proceso, pero al reiniciarlo
relee el estado durable y continúa sin regenerar `docs/` ni `generated/`.

Reglas:

- el `RunLock` del coordinador se mantiene durante toda la vida de `supervise`, incluido el sleep entre
  ticks; una segunda instancia falla cerrada inmediatamente. Nunca resolver la colisión con `pgrep` más
  `kill -9`, porque puede terminar procesos ajenos o perder cleanup/evidencia;
- mientras haya heartbeat nuevo, el job puede continuar aunque el comando sea largo;
- un mismo heartbeat leído repetidamente no renueva indefinidamente la lease;
- un heartbeat cuyo token no pertenece al lease actual se mueve a `attempt/invalid/`; no se acepta como
  progreso ni se vuelve a reportar en bucle en cada tick;
- todo comando largo debe ejecutarse mediante el wrapper administrado del worker;
- `watch`, dev servers y comandos interactivos no pueden quedar sin owner;
- un servicio temporal debe registrar PID/tipo, condición de vida, healthcheck y cleanup;
- el supervisor solo cancela el árbol de procesos que el wrapper creó; nunca terminales ajenas;
- ante timeout escribe `cancel.json`, espera el grace period y clasifica `STALLED`;
- si el intento más reciente escribe resultado después del timeout, puede adoptarlo solo tras validar
  lease, hashes, claims y commit; un intento stale o ya consumido se rechaza;
- si `last_result_attempt` ya coincide con ese intento, el supervisor lo omite antes de intentar una
  adopción tardía; conservar `result.json` en disco no debe generar `already consumed` cada 15 segundos;
- el worker intenta interrupción controlada y después termina su propio process tree si es necesario;
- el coordinador reintenta solo ese prompt cuando el fallo es atribuible; un fallo de integración
  conjunto reintenta únicamente su subola;
- al agotar intentos queda `FAILED` y la fase no avanza silenciosamente.

Valores base recomendados, ajustables por proyecto:

```text
check_every_seconds       = 15
heartbeat_timeout_seconds = 600
stall_grace_seconds       = 30
max_retries               = 2
workers                   = 1..64 (capacidad; recomendado inicial 2..6)
```

El contrato de terminal debe aparecer en los prompts compilados: no dejar procesos no administrados,
reportar progreso, respetar cancelación y completar cleanup antes de declarar el task terminado. El
wrapper calcula un `command_id` con job, attempt, base, workspace, comando y retry ID; una segunda
solicitud idéntica reutiliza el resultado terminal o se rechaza si sigue activa. Un rerun deliberado usa
otro retry ID y nunca crea silenciosamente dos terminales equivalentes.

## Memoria durable entre chats

Cada change raíz mantiene, cuando OpenSpec aplique:

```text
openspec/changes/<change-id>/
├── proposal.md
├── design.md
├── tasks.md
└── execution-memory.md
```

- PROPOSE define tareas pequeñas con IDs estables, dependencias, riesgos, skills y referencias;
- `execution-memory.md` conserva handoff compacto: invariantes, paths/URLs, hipótesis, comandos con
  exit code, evidencias, commits y riesgos restantes;
- APPLY relee tasks, memoria, skills y referencias obligatorias antes de modificar código;
- REVIEW comprueba independientemente cada tarea, claim, commit, check y evidencia, pero solo lee esta
  memoria: no actualiza `execution-memory.md`, `review.md` ni otro archivo durante el audit;
- el JSON del runner coordina ejecución, pero no sustituye esta memoria semántica versionada.

Si REVIEW descubre que OpenSpec o la memoria durable deben cambiar, debe producir un gap verificable y
crear después un FIX/APPLY documental con `dedicated-worktree` y `write_paths` exactos. Nunca convertir
`read-only` en “puede escribir solo Markdown”, nunca auto-commitear desde la raíz de integración y nunca
usar cambios sucios como evidencia implícita.

Base Code Memory o un índice similar acelera recuperación; no sustituye archivos actuales, OpenSpec,
owners, Git, tests ni evidencia reproducible.

## Reparación, reintento y BLOCKED

Ante `FAILED`, `BLOCKED` o `STALLED`:

1. preservar job/pack/fase y crear un nuevo `attempt_id` cuando corresponda;
2. reproducir la causa con comando/log real;
3. reparar lo técnicamente resoluble dentro de `allowed_paths`/claims;
4. reejecutar tests, build, lint, typecheck y migraciones aplicables;
5. producir un nuevo commit verificable;
6. no repetir siblings ya completados;
7. detenerse únicamente ante un impedimento humano/externo demostrado o retries agotados.

Si se repite la causa, registrar la hipótesis descartada y cambiar la estrategia. No fabricar `PASS`:

- no hardcodear salidas;
- no desactivar pruebas ni debilitar assertions/gates;
- no reemplazar integración requerida por mocks engañosos;
- no editar manualmente `generated/**` ni locks;
- no inventar aprobaciones, credenciales, contratos o reglas de negocio;
- no usar un heartbeat falso para ocultar falta de progreso.

## Commits y artefactos derivados

- cada prompt mutante aprobado produce un commit pequeño, coherente y con nombre que describa el cambio
  de negocio/técnico real;
- el mensaje y comentarios del código no deben mencionar mecánica interna como “por docs”, “generated”
  o “Prompt Builder” si eso no pertenece al dominio del producto;
- PROPOSE read-only puede producir solo artefactos de especificación cuando así lo defina el plan;
- REVIEW no modifica ningún archivo del repositorio; una fase FIX explícita realiza las correcciones;
- `git diff --check` continúa estricto para código y trailing whitespace. Solo puede tolerarse el
  diagnóstico `new blank line at EOF` cuando todos los offenders son `.md`/`.mdx`; nunca desactivar
  globalmente `blank-at-eol` ni ocultar errores de whitespace de código;
- `generated/` no se agrega al repositorio consumidor cuando la policy lo declara derivado;
- sí se versionan los cambios canónicos en `docs/`, OpenSpec y código fuente que correspondan;
- jamás incluir lease tokens, secretos, outputs sensibles o estado runtime en el commit.

## Templates y código compartido

Una carpeta proporcionada como template, incluso si contiene `shared/` u otras piezas todavía no
copiadas al proyecto, es material reutilizable de solo lectura. Debe inspeccionarse, adaptarse a la
arquitectura destino y probarse; su layout distinto o su falta de uso inicial no constituyen BLOCKED.

## Composición de skills sin redundancia

- Una práctica transversal debe tener un solo owner reutilizable; las skills de Node/Nest, Laravel u
  otros stacks la referencian y conservan únicamente framework, librerías, layout y comandos propios.
- Para backend, resolver `backend-engineering-quality` cuando esté presente en el catálogo y combinarla
  con la skill específica del stack. No copiar sus reglas de API/OpenAPI, testing por riesgo o SQL/datos.
- `review-code-change` conserva el checklist común de revisión; una skill de implementación no debe
  duplicarlo ni convertirse en un gate de aprobación.
- Leer completa cada skill anidada y las referencias que su routing marque como obligatorias. La
  composición no reduce la disciplina de lectura ni altera la precedencia del repositorio consumidor.

## Diseño de `docs/` para Prompt Builder 0.12.1 / execution-plan schema v3

La compatibilidad v3 no se obtiene cambiando únicamente `schema_version`. Cada pack ejecutable debe
declarar un scope que permita al scheduler probar que dos trabajos pueden convivir. Un pack mínimo se
parece conceptualmente a esto (usando arquitectura **Zero-`contracts/`** con OpenAPI/DTOs del módulo owner, sin carpetas `packages/contracts/` innecesarias); los demás campos obligatorios se conservan según el schema descubierto:

```yaml
schema_version: 3
id: module.orders.create-order
version: 1

scope:
  allowed_paths:
    - apps/api/src/modules/orders/**
    - apps/api/test/orders/**
    - openspec/changes/create-order/**
  forbidden_paths:
    - generated/**
    - .prompt-runner/**
    - docs/rules/**

execution:
  enabled: true
  order: 120
  concurrency:
    strategy: resource-claims
    isolation: dedicated-worktree
    phases:
      propose:
        write_paths:
          - openspec/changes/create-order/**
      apply:
        read_paths:
          - apps/api/openapi/openapi.yaml
          - apps/api/src/modules/catalog/public/**
        write_paths:
          - apps/api/src/modules/orders/**
          - apps/api/test/orders/**
        exclusive_resources:
          - orders-integration-db
      review:
        read_paths:
          - apps/api/src/modules/orders/**
          - apps/api/test/orders/**
```

### Diseño de `docs/rules/target-profiles.yaml` en Prompt Builder `0.12.1` (Zero-`contracts/` por defecto)

En proyectos nuevos (greenfield) o monolitos/monorepos modernos, **nunca crear carpetas `contracts/` ni `packages/contracts/` artificiales**. El backend es dueño de sus schemas/DTOs y exporta OpenAPI (`/api/docs-json` o archivo `openapi.yaml`), mientras el frontend genera tipos TypeScript (`openapi-typescript` / `@hey-api/openapi-ts`). `0.12.1` modela explícitamente los tres modos reales:

```yaml
schema_version: 1
profiles:
  # 1. Recomendado Greenfield Web + API (Zero-contracts, OpenAPI-driven)
  compose-fullstack:
    backend:
      repository: app-monorepo
      root: apps/api
      state: target_not_materialized
      app_path: src
      openapi_spec: openapi/openapi.yaml
    frontend:
      repository: app-monorepo
      root: apps/web
      state: target_not_materialized
      app_path: src
      package_manifest: package.json
    contract:
      owner: app-monorepo
      consumer: app-monorepo
      mode: openapi
      openapi_spec: openapi/openapi.yaml
    forbidden_paths:
      - generated/**
      - .prompt-runner/**

  # 2. Backend puro / Modular Monolith / Desktop / CLI / Videojuego (sin paquete de contratos)
  standalone-app:
    backend:
      repository: core-app
      root: apps/core
      state: current
    frontend:
      repository: core-app
      root: apps/ui
      state: current
    contract:
      owner: core-app
      consumer: core-app
      mode: none

  # 3. Compatibilidad Brownfield (SOLO si el repo legado ya publica físicamente un paquete npm de contratos)
  legacy-multirepo-pkg:
    backend:
      repository: legacy-api
      root: apps/legacy-api
      state: current
      contract_manifest: packages/contracts/package.json
    frontend:
      repository: legacy-web
      root: apps/legacy-web
      state: current
      package_manifest: package.json
    contract:
      owner: legacy-api
      consumer: legacy-web
      mode: package
      package: "@org/legacy-contracts"
```

Este ejemplo no se copia a ciegas. Debe adaptarse al schema, repositorios, comandos y owners reales.
En particular:

- un `write_path` debe estar contenido en `allowed_paths` y no intersectar `forbidden_paths`;
- usar paths root-relative con prefijo estático útil (`generated/**`, no `**/generated/**`) cuando el
  validador de overlap sea conservador; un glob que empieza en wildcard puede solapar todo y hacer fallar
  correctamente cualquier claim;
- `read_paths` declara información que otro worker no puede modificar mientras este job la consume;
- write/write y write/read solapados se consideran conflicto;
- dos jobs que repiten el mismo `exclusive_resource` se serializan aunque sus paths sean distintos;
- `shared-worktree` con cualquier escritura se serializa; para paralelismo mutante usar
  `dedicated-worktree`;
- `read-only` no puede declarar `write_paths`;
- `strategy: serial` no debe llevar claims: expresa de forma explícita que el pack no es paralelizable;
- si no puede demostrarse un claim exacto, usar serial. Nunca declarar paths falsamente estrechos para
  conseguir cuatro workers.

Los nombres de recursos exclusivos deben ser estables y describir el recurso real, no el prompt:

```text
postgres-migrations
shared-integration-db
desktop-ui-session
android-emulator-5554
fixed-port-3000
package-lockfile
release-signing
```

No usar nombres por worker (`db-worker-1`) para esconder que todos acceden a la misma database.

## Inmutabilidad de las entradas durante una corrida

Una vez generado el plan, sus fuentes y hashes forman un snapshot lógico. Mientras existan jobs activos:

- APPLY no debe modificar el `prompt-pack.yaml`, el `task.md`, `answers.md`, registry, plan, template ni
  otro documento usado para compilar su propio PROPOSE/APPLY/REVIEW;
- no incluir `docs/rules/**` en `write_paths` de un pack de implementación;
- no usar el documento canónico de la tarea como checklist mutable de progreso;
- el progreso operativo vive en `.prompt-runner/`; la evidencia durable aprobada vive en Git/OpenSpec o
  `generated/evidence` según la policy, pero no altera silenciosamente la entrada del siguiente phase;
- si la implementación descubre una corrección semántica necesaria en `docs/`, registrar `BLOCKED` o
  abrir un cambio documental explícito, regenerar lo afectado y reconciliar el estado;
- un cambio de hash nunca se ignora ni se corrige editando el lock.

Esta regla evita el fallo en que APPLY actualiza su propio `task.md` y REVIEW queda inmediatamente stale.
Si el proyecto necesita sincronizar documentación después del código, modelar un pack/fase de docs
separado, con dependencia explícita y nueva generación; no mezclarlo dentro del APPLY que depende de esa
misma documentación.

## Planes ejecutables de tamaño controlado

Un `full-project` con cientos o miles de packs sirve como inventario, pero no siempre es una buena unidad
operativa. El launcher recomendado persiste cohortes verticales de tamaño `--cohort-size` (por defecto,
igual a `--workers`) y completa “hasta N PROPOSE → hasta N APPLY → hasta N REVIEW” antes de seleccionar
los siguientes packs. Las dependencias y conflictos pueden reducir temporalmente la cantidad activa.

Aunque el launcher ya controla cohortes, sigue siendo preferible crear planes verticales pequeños de dos
a seis packs cuando un `full-project` sea difícil de revisar, integrar o revertir. Cada slice debe:

- entregar una capacidad verificable, no N archivos elegidos al azar;
- incluir dependencias transitivas necesarias;
- caber en una ventana de integración y rollback razonable;
- tener claims no solapados o aceptar que el scheduler reduzca la cohorte;
- mantener el mismo orden determinista al regenerarse sin cambios semánticos;
- definir aceptación y evidencia de extremo a extremo.

No asumir que `--workers N` siempre crea N sesiones. Es un máximo. El scheduler puede devolver menos o
ninguna cuando existen dependencias, barreras, jobs activos o recursos compartidos.

## Diseño de tests para que los workers no choquen

Los quality gates deben especificar tanto el comando como su modelo de aislamiento. Antes de declarar un
pack paralelo, clasificar cada test:

```text
PURE_ISOLATED
ISOLATED_BY_WORKTREE
ISOLATED_BY_NAMESPACE
SHARED_EXCLUSIVE
EXTERNAL_SERIAL
```

Reglas mínimas:

- unit tests puros pueden correr juntos cuando no escriben snapshots, fixtures o caches compartidos;
- snapshots y golden files son `write_paths`, no simples lecturas;
- integration tests deben usar database/schema/tenant/queue namespace únicos por `attempt_id`, o declarar
  el servicio compartido como `exclusive_resource`;
- migrations contra la misma database siempre usan un recurso exclusivo;
- cada worker debe tener directorio temporal, coverage output, test-results y artifacts propios;
- puertos fijos, emuladores, navegador/desktop UI, clipboard y pantalla compartida se declaran exclusivos;
- Docker / Podman Compose debe usar project name y volúmenes únicos por intento, más cleanup verificable;
- tests que cambian clock global, environment global, feature flags remotos o datos singleton se
  serializan salvo aislamiento demostrado;
- package install/build que escribe el mismo `node_modules`, build directory, lockfile o cache local no
  corre en paralelo sobre esa superficie;
- nunca resolver una colisión desactivando tests, reduciendo assertions o aceptando flakiness.

El pack debe indicar comandos acotados cuando existan:

```text
lint/typecheck del workspace afectado
unit tests del módulo
integration/contract tests del capability
build del target afectado
smoke/E2E solo cuando el slice lo requiere
```

REVIEW reejecuta como mínimo los gates relevantes del commit integrado. Un test pasado únicamente dentro
del worktree del worker no prueba que el conjunto integrado sea válido.

## Integración de commits y conflictos reales

Cada worker mutante opera sobre una base fijada y produce un commit. El coordinador integra en orden
determinista por subolas y vuelve a validar cada conjunto integrado. Los claims reducen conflictos, pero
no sustituyen Git ni los tests.

Si dos commits no tocan los mismos paths pero rompen una API, schema, import, fixture o invariant común:

1. detener la promoción de la subola;
2. conservar como `done` únicamente subolas anteriores ya validadas;
3. marcar retryable toda la subola si el check combinado no permite identificar un único culpable;
4. crear nuevos intentos sobre el Git base integrado actual, sin reutilizar el `result.json` consumido;
5. ejecutar nuevamente los gates focalizados y los gates de integración;
6. generar resultados nuevos ligados a los nuevos `attempt_id`, commit y base SHA.

No marcar `done` un commit que solo pasó antes de integrarse. No usar `git reset --hard`, limpieza global o
force-push como mecanismo automático de reparación.

## Terminales, procesos largos y servicios temporales

El agente no debe buscar “cualquier terminal abierta” ni matar procesos por nombre. Eso puede finalizar
sesiones del usuario u otros workers. El control es por ownership: únicamente el wrapper que creó el
process group puede cancelarlo.

Clasificar comandos antes de ejecutarlos:

```text
SHORT_FOREGROUND       # termina pronto; captura exit code
LONG_MANAGED           # wrapper + heartbeat + timeout
TEMPORARY_SERVICE      # wrapper + PID + healthcheck + finally cleanup
INTERACTIVE_FORBIDDEN  # requiere humano/TUI; no apto para worker autónomo
WATCH_FORBIDDEN        # watch/dev sin condición de terminación; reemplazar por comando one-shot
```

Contrato para un servicio temporal:

```text
owner_job_id
attempt_id
pid/process_group
start_command_hash
healthcheck
ready_deadline
maximum_lifetime
dependent_command
graceful_stop
forced_cleanup limited to owned tree
cleanup_result
```

Un heartbeat describe progreso real del job; no es un cron que relee el prompt ni una señal artificial
para impedir timeout. Debe actualizarse cuando el worker está razonando/trabajando y el wrapper lo emite
mientras un comando administrado sigue vivo. Si el comando terminó pero el agent quedó colgado, deja de
haber progreso y el supervisor puede cancelar/reintentar ese intento.

Antes de producir `result.json`, el worker debe comprobar:

- no quedan procesos, children, handles o servicios temporales que le pertenezcan;
- existe exit code de cada gate;
- los outputs requeridos están cerrados y en paths attempt-scoped;
- no existe `cancel.json` pendiente;
- el commit y changed-files corresponden al intento actual.

## Estado runtime, Git y recuperación

`.prompt-runner/` es mutable, local y específico de una ejecución. Debe estar ignorado por Git, en
especial:

```text
*.runner.lock
state.json
events.jsonl
heartbeat.json
cancel.json
request.json
result.json
*.log
preflight-latest.log
```

No subir un lock activo: su PID/host no representa otro equipo y puede simular que el runner sigue vivo.
No subir lease tokens ni logs que puedan contener paths, respuestas o datos sensibles. Si se necesita un
historial durable, exportar un resumen sanitizado con logical IDs, commits, checks y evidencia; no
versionar el directorio operativo completo.

La recuperación después de un crash usa el mismo state local:

- `done` permanece terminado mientras su identidad/resultado siga válido;
- un `running` huérfano no se repite ciegamente; se clasifica interrupted/stalled y se reconcilia;
- un retry crea otro `attempt_id` y no sobrescribe evidencia del intento anterior;
- los números de intento son monotónicos. Si el directorio del próximo intento ya existe por una edición
  manual o estado inconsistente, quitar primero su worktree por ruta exacta y mover a
  `orphaned/<job>/...` únicamente metadata, JSON y evidencia compacta; no reutilizar sus lease tokens;
- antes de `git worktree add`, ejecutar `git worktree prune`; esto limpia registros cuyo directorio ya no
  existe sin borrar worktrees vivos;
- un worktree existe solo mientras el intento está activo o pendiente de integración. Después de `done`,
  fallo terminal o supersession se elimina, conservando `request.json`, `result.json`, heartbeat,
  `cleanup.json` y, cuando haga falta, `recovery.json` más un patch acotado;
- nunca conservar por prompt `target/`, `node_modules/`, coverage, `dist/` ni caches dentro de
  `.prompt-runner/`; con `--workers N` debe haber como máximo N checkouts activos, no N copias por lote
  histórico;
- sesiones `leased`, `running`, `stalled`, `produced`, `merge_pending` o `validated` están protegidas. Un
  timeout primero cancela y confirma la terminación del proceso propio; recién después permite cleanup;
- `--keep-failed-worktrees` es solo diagnóstico manual, está desactivado por defecto y no debe usarse en
  colas largas;
- el supervisor no rebobina siblings completados por un fallo aislado;
- estado ilegible, plan distinto o resultados cruzados fallan cerrados.

## Regeneración, anti-rewind y compatibilidad con una corrida anterior

`generated/` puede reconstruirse, pero regenerar no significa que el historial siga siendo aplicable.
Antes de regenerar una cola activa:

1. detener coordinador y workers;
2. capturar el Git SHA, versión del builder, schema del plan y fingerprint/hashes actuales;
3. respaldar fuera de la ruta publicada `generated/` y `.prompt-runner/`;
4. ejecutar dry-run/migrate y revisar el diff esperado;
5. preferir regeneración del pack mínimo afectado cuando el toolchain la soporte;
6. reconciliar por identidad lógica y hashes antes de reanudar;
7. conservar `done` solo si el nuevo plan puede demostrar equivalencia o existe evidencia/commit validado
   por una migración explícita;
8. dejar pendiente cualquier job cuya equivalencia no pueda demostrarse.

Estas reglas existen solo para terminar o migrar una corrida anterior schema v2; no son el flujo
recomendado para proyectos nuevos:

- `chatgpt_prompt_queue.py --workers 1` conserva el comportamiento secuencial;
- schema v2 puede ser leído por el coordinador compatible, pero sigue serial porque no tiene claims v3;
- no forzar `chatgpt_prompt_queue.py --workers 2..N`; el visual legacy permanece en uno y el paralelismo
  usa `senior_agent_launcher.py` con un adapter que abra una sesión nueva por invocación;
- no cambiar builder/schema/locks a mitad de miles de prompts sin un migrador de estado;
- cambiar la versión del builder o el terminal contract puede alterar todos los hashes y provocar rewind
  desde el primer step afectado;
- el estado legacy no se convierte automáticamente en estado Senior Mode;
- una migración segura relaciona `logical_id`, phase, prompt hash, lock hash, commit y evidencia. Coincidir
  solo por número (`0213`) no es suficiente.

Si un pack ya ejecutado cambió su fuente, el rewind desde ese pack es una protección deliberada. No editar
el JSON para conservar artificialmente `done`. En proyectos con colas grandes, finalizar el run legacy o
migrarlo con tooling explícito antes de adoptar Prompt Builder 0.12.1 paralelo.

## Checklist de publicación de `docs/` para Senior Mode

No declarar el proyecto listo para paralelismo hasta confirmar:

```text
[ ] cada pack ejecutable usa schema soportado
[ ] IDs y depends_on son estables, únicos y acíclicos
[ ] plans seleccionan slices operables, no una cola accidentalmente gigantesca
[ ] allowed/forbidden paths coinciden con repos reales
[ ] docs canónicos no son write targets de APPLY
[ ] claims read/write cubren todas las superficies tocables
[ ] recursos externos compartidos tienen exclusive_resources
[ ] tests tienen aislamiento o serialización explícita
[ ] worktree, temp, coverage, ports, DB y containers tienen ownership
[ ] comandos largos usan wrapper, heartbeat, timeout y cleanup
[ ] preflight prueba runtime/servicios/permisos sin revelar secretos
[ ] generated/ verifica locks y no contiene ediciones manuales
[ ] .prompt-runner/ está ignorado y separado de evidencia durable
[ ] workers=1 conserva la ejecución secuencial
[ ] workers>1 solo se habilita con schema v3, claims explícitos o fallback APPLY/FIX conservador, y
    adapter multi-sesión probado
[ ] integración revalida commits sobre la base integrada
[ ] retry/stall no repite siblings terminados
[ ] cualquier migración de historial falla cerrada ante identidad ambigua
```

---

# 45. Definition of docs complete

`docs/` está completo cuando:

```text
human decision gate passed
AND answers has no material OPEN
AND coverage inventory matrix has 0 missing modules/use-cases/endpoints/screens/tables/jobs
AND project summary matches detailed owners
AND all required physical targets exist
AND target-specific depth passes (0 forbidden shortcuts/placeholders)
AND 14-point 360° cross-file synchronization passes (0 drift)
AND registry/manifests/plans pass
AND Prompt Builder schemas pass when available
AND real CLI gates pass or are explicitly NOT_EXECUTED with honest epistemic state
AND independent senior review passes
```

---

# 46. Independent second pass

Después de generar todos los archivos, revisar cada target otra vez:

- purpose;
- authority;
- lifecycle;
- applicability;
- architecture;
- data;
- security;
- concurrency;
- idempotency;
- errors;
- edge cases;
- operations;
- testing;
- traceability;
- Prompt Builder/tooling shape;
- hidden assumptions;
- unresolved decisions.

Si un target quedaría mejor si se pidiera solo:

```text
FAIL_COMPLETENESS
```

Expandirlo.

---

# 46.1 Super-Skill Integrada: `senior-exhaustiveness-honesty-sync` — Cero Atajos, Honestidad Radical y Sincronización Total 360°

Esta super-skill es **obligatoria e inseparable** de `senior-docs-factory`. Su misión es garantizar que ningún agente recorte alcance para ahorrar tokens, omita detalles críticos al crear documentación o código, maquille validaciones no ejecutadas ni deje archivos desincronizados entre sí.

> **Ley Rectora:** *Ser conciso en la redacción, jamás en la cobertura. Resumen inteligente = eliminar redundancia; resumen deficiente = amputar conocimiento.*

## 1. Motor de Exhaustividad Sin Atajos (`Inventory-First, Zero-Truncation`)

Antes de escribir los documentos definitivos, construir explícitamente la **Matriz Maestra de Cobertura** del proyecto (`Unidad → Archivo Owner → Dependencias → Consumidores → Estado`):

1. **Inventario 100% enumerado antes de redactar:** listar todos los actores, roles/permisos, módulos (`01-modules/*`), casos de uso (con verbos de dominio reales: `registerOrder`, `capturePayment`, `cancelReservation`, `approveSettlement` — nunca CRUD genérico `index/store/destroy` donde exista semántica de negocio), endpoints/operaciones, pantallas/modales/drawers, tablas/índices/constraints, colas/eventos/webhooks, integraciones externas, ADRs, runbooks y `prompt-pack.yaml`.
2. **Prohibición absoluta de truncamiento por lote:** si el proyecto tiene 14 módulos o 38 endpoints, documentar los 14 módulos y los 38 endpoints con profundidad completa. Si el límite de salida de un turno no alcanza, dividir la escritura en **lotes secuenciales numerados (`Lote 1/N … Lote N/N`)** hasta completar el `100%` del inventario antes del Audit y del ZIP.
3. **Expresiones prohibidas en archivos de producto (`FAIL_COMPLETENESS` automático):**
   - `"etc."`, `"..."`, `"y similares"`, `"y otros"`, `"igual al anterior"`, `"ver módulo X"` (cuando omite las reglas locales), `"por definir"`, `"TODO"`, `"TBD"`, `"FIXME"`, `"aplicar validaciones estándar"`, `"manejar errores habituales"`.

## 2. Estándar Mínimo de Detalle Atómico por Superficie

Cada archivo generado debe contener suficiente precisión para implementar y probar **sin adivinar una sola regla**:

- **Modelo de Datos y SQL (`data.md` / `class.md`):** nombres exactos `snake_case`, tipos nativos del motor, nulabilidad, defaults, estrategia de PK (`UUIDv7` u otra aprobada), FKs con acción `ON DELETE` explícita, `CHECK` constraints (`stock >= 0`, `total_cents >= 0`), índices `UNIQUE`/parciales/compuestos alineados con filtros y paginación por cursor reales, estrategia de bloqueo concurrente (`SELECT ... FOR UPDATE` o columna `version` optimista), semántica monetaria exacta (`integer` en centavos o `NUMERIC(p,s)` con regla de redondeo, jamás `float`), clasificación PII, retención y migración expand/contract sin pérdida de datos.
- **Reglas de Negocio y Transacciones (`business.md`):** precondiciones, validación de autorización y ownership (prevención explícita de BOLA/IDOR), pasos transaccionales en orden exacto, máquina de estados (transiciones válidas y transiciones prohibidas con `409 Conflict`), clave de idempotencia (scope, TTL y hash de payload obligatorios en pagos, órdenes, webhooks, correos y asientos contables), efectos secundarios fuera de la transacción DB (patrón Outbox o cola idempotente), compensación ante fallo parcial externo y auditoría.
- **Contratos API / IPC (`endpoints.md` / OpenAPI Zero-`contracts/`):** método, ruta exacta, auth/guard, rate-limit si aplica, parámetros path/query/header/body con tipos y cotas exactas (`min`, `max`, `format`, `enum`), paginación determinista, esquemas de respuesta por código HTTP (`200/201/202/204/400/401/403/404/409/422/429/500/503`), catálogo de `error_code` estable y estrategia **Zero-`contracts/`** en greenfield (OpenAPI exportado por el backend y tipos generados en el consumidor, sin carpetas `packages/contracts/` innecesarias).
- **Experiencia UX/UI, Accesibilidad y Motion (`pages.md` / `screens.md` + `00-global/ui/**`):** jerarquía visual y arquitectura de información, design tokens (contraste WCAG 2.1/2.2 AA, escala tipográfica, espaciado), comportamiento responsive real (`360px` móvil, `768px` tablet, `1280px+` desktop), navegación completa por teclado + gestión de foco + `Esc` + roles ARIA, micro-interacciones con propósito (`CLS = 0`, skeletons en lugar de spinners bloqueantes de pantalla completa, respeto a `prefers-reduced-motion`) y cobertura explícita de los **12 estados de UI obligatorios**:
  `loading`, `empty`, `populated`, `validation_error`, `submitting_disabled`, `success`, `unauthenticated_401`, `forbidden_403`, `not_found_404`, `conflict_409`, `ambiguous_timeout`, `degraded_offline`.
- **Testing por Riesgo Real (`tests.md`):** unitarios de invariantes y cálculos, integración contra contenedores reales (carreras de concurrencia en stock/saldo, constraints SQL, migraciones), contrato/OpenAPI, seguridad (authn/authz/BOLA/XSS/CSP/firma de webhooks/rate-limit), idempotencia/replays duplicados, accesibilidad/componentes UI y E2E del flujo crítico de punta a punta, declarando su clase de aislamiento (`PURE_ISOLATED`, `ISOLATED_BY_NAMESPACE`, `SHARED_EXCLUSIVE`, etc.).
- **Plataforma, DevSecOps y FinOps (`operations.md` / `delivery.md`):** Tier dimensionado sin sobre-ingeniería (`Tier 1 compose-vps` con Docker/Rootless Podman + Caddy TLS + PG PITR sin K8s; `Tier 2 k8s-gitops-selfhosted`; `Tier 3 cloud-aws-gitops`; o cliente puro), contenedores no-root, bases de datos y caches aislados en red privada sin puertos públicos, referencias lógicas de secretos (cero secretos en claro), logs JSON estructurados sin fuga de PII, SLIs/alertas accionables, backup + prueba de restore verificada y plan de rollback/forward-fix.

## 3. Protocolo de Honestidad Epistémica Radical (`Zero Hallucination / Zero Fake-Pass`)

El agente MUST distinguir en todo momento los **6 estados epistémicos** y jamás promocionar uno inferior como si fuera superior:

| Estado Epistémico | Qué significa realmente | Qué está prohibido afirmar |
|---|---|---|
| `VERIFIED_EXECUTION` | Comando real ejecutado en esta sesión con `exit code 0` y salida inspeccionada. | Usar este estado si el comando solo fue imaginado o inferido. |
| `STATIC_VERIFIED` | Archivos leídos e invariantes validados estáticamente (script/parser/lectura cruzada), sin CLI oficial disponible. | Reportarlo como `CLI_PASS` del binario oficial. |
| `EVIDENCE_OBSERVED` | Hecho leído directamente en código, SQL, configuración o Git del proyecto actual (`CURRENT`). | Mezclarlo con arquitectura deseada (`TARGET`). |
| `APPROVED_DECISION` | Decisión respondida por el humano o cerrada bajo regla autorizada de auto-recomendación reversible (`answers.md`). | Marcar `ANSWERED` una regla de negocio/dinero/compliance sin respuesta humana. |
| `DESIGNED_TARGET` | Especificación objetivo para código aún no materializado (`TARGET_NOT_MATERIALIZED`). | Describirlo en `BROWNFIELD`/`MIGRATION` como si ya existiera en producción. |
| `NOT_EXECUTED / BLOCKED` | Herramienta no instalada, servicio apagado o insumo externo pendiente. | Ocultarlo, escribir `PASS` o bajar la exigencia del validador para forzar verde. |

Reglas inquebrantables de honestidad:
- Nunca declarar que se leyeron skills, normas o archivos del repositorio que no fueron realmente abiertos en la sesión (`skills_loaded` y `canonical_sources_read` deben reflejar lecturas reales).
- Nunca redondear completitud: si existen `51/52` archivos listos y `1` pendiente o bloqueado, reportar `51/52` con el hueco exacto, jamás `"100% completo"`.
- Separar siempre la **calidad/completitud documental** del **nivel real de verificación ejecutada en runtime**.

## 4. Matriz de Sincronización Total 360° (`14-Point Zero-Drift Sync Gate`)

Antes de declarar `DOCS_COMPLETE` o empaquetar el ZIP, verificar que los **14 enlaces bidireccionales** tengan **cero deriva (`drift == 0`)**:

| # | Superficie A ↔ Superficie B | Invariante Exacto Obligatorio | Fallo Grave que Previene |
|---|---|---|---|
| 1 | `answers.md` ↔ Owners (`00-global/*`, `01-modules/*`, `target-profiles.yaml`) | Toda `Q-*` `ANSWERED` está reflejada sin contradicción en sus documentos owners declarados. | Decisiones aprobadas en `answers.md` que el código ignora porque el owner quedó viejo. |
| 2 | `project-brief.md` ↔ `01-modules/*` ↔ `PROJECT-SUMMARY.md` | Todo actor, módulo, flujo crítico e integración del brief existe en módulos y en el resumen final (0 requisitos huérfanos, 0 módulos fantasma). | Alcance incompleto o módulos inventados fuera de scope. |
| 3 | `endpoints.md` / OpenAPI ↔ `pages.md` / `screens.md` | Toda consulta o mutación de UI apunta a una operación/ruta existente con el mismo payload; todo endpoint público tiene consumidor identificado. | Pantallas que llaman endpoints inexistentes o contratos rotos FE/BE. |
| 4 | `business.md` ↔ `data.md` / `class.md` | Cada estado, regla de unicidad, precisión monetaria y lock de concurrencia tiene su columna, `CHECK`, enum e índice real en datos. | Sobreventas, saldos negativos o estados imposibles de persistir. |
| 5 | `business.md` ↔ `events.md` / `background-jobs.md` | Todo efecto asíncrono declara productor, consumidor, payload, clave de idempotencia, política de retry/backoff y DLQ/fallo. | Doble cobro, correos duplicados o eventos perdidos en silencio. |
| 6 | `00-global/security.md` ↔ `endpoints.md` ↔ `pages.md` | Roles, capabilities, guards, modelo de sesión (`HttpOnly` cookies / OIDC / token) y reglas CORS/CSP coinciden carácter por carácter. | Huecos de autorización o nombres de roles distintos por archivo. |
| 7 | `Error Catalog` ↔ `endpoints.md` ↔ `pages.md` | Los códigos de error de dominio y HTTP status codes coinciden entre quien los emite en backend y quien los maneja en UI. | Mensajes genéricos `500` o formularios que no muestran qué falló. |
| 8 | `External Integrations` ↔ `operations.md` ↔ `preflight` | Variables de entorno (`PUBLIC_*` vs refs privadas), estado de cuenta (`READY`/`TO_PROVISION_*`), webhooks y timeouts coinciden. | Bloqueos sorpresa a mitad de `APPLY` o fuga de secretos al bundle web. |
| 9 | `Seeders / Fixtures` ↔ `data.md` ↔ `PROJECT-SUMMARY.md` ↔ `tests.md` | Los seeders respetan orden de FKs, unicidad y separación estricta entre catálogos base de producción y datos sintéticos de dev/test. | Fallos de arranque local o carga accidental de usuarios de prueba en prod. |
| 10 | `registry.yaml` ↔ `prompt-pack.yaml` en disco | Biyección `1:1` entre packs de producto registrados y manifiestos reales en disco (`99-templates/` aislado fuera del scan de producto). | `RESOLVER_PASS` fallido, packs huérfanos nunca compilados o paths rotos. |
| 11 | `plans/*.yaml` ↔ `registry.yaml` ↔ `depends_on` | Todos los IDs seleccionados en `full-project.yaml` y slices verticales existen en `registry.yaml`, forman un DAG acíclico e incluyen prerrequisitos. | Ciclos de dependencias o slices que fallan por falta de tabla/módulo base. |
| 12 | `prompt-pack.yaml` (`scope`) ↔ `concurrency.phases` ↔ `target-profiles.yaml` | Todo `write_path` está dentro de `allowed_paths`, fuera de `forbidden_paths` (`docs/rules/**`, `generated/**`, `.prompt-runner/**`) y declara `exclusive_resources` reales. | Colisiones entre workers paralelos o invalidación de hashes en `REVIEW`. |
| 13 | `Glosario / Ubiquitous Language` ↔ Todo `docs/` | Mismos nombres de entidades, estados y convenciones (`snake_case` SQL/datos, `PascalCase` tipos/clases, `camelCase` métodos) en todos los archivos. | Dos nombres distintos (`Order` vs `Purchase`, `cancelled` vs `canceled`) para el mismo concepto. |
| 14 | `Docs Factory Audit` ↔ Inventario físico y `SHA-256` del ZIP | Conteo exacto de archivos, rutas, estados `PASS/FAIL/BLOCKED/NOT_EXECUTED` y hash `SHA-256` verificados contra el archivo comprimido real. | Auditoría desfasada respecto al contenido real entregado en el ZIP. |

## 5. Guardrails Rápidos Senior Mode (`✅ Hacer` vs `❌ Nunca Hacer`)

| Dimensión | ✅ Qué SÍ Hacer (Senior Mode) | ❌ Qué NUNCA Hacer |
|---|---|---|
| **Decisiones Humanas** | Consolidar todas las dudas materiales abiertas en una sola ronda clara con opciones `A/B/C` y recomendación fundamentada antes del `docs/` final. | Asumir reglas de dinero/auth/tenancy en silencio o preguntar a cuentagotas una duda por turno. |
| **Profundidad Documental** | Escribir cada módulo, caso de uso, pantalla, tabla y test con especificidad completa lista para codificar sin adivinar. | Usar `"etc."`, `"por definir"`, `"igual al anterior"` o comprimir 10 módulos en 3 ejemplos. |
| **Contratos FE/BE** | Usar **Zero-`contracts/`** en greenfield (`mode: openapi` o `mode: none` en `target-profiles.yaml`), derivando tipos desde el OpenAPI/schema del owner. | Crear carpetas `contracts/` o `packages/contracts/` artificiales en proyectos nuevos. |
| **Infraestructura y FinOps** | Elegir el Tier proporcional (`compose-vps` con Docker/Rootless Podman + Caddy para simple/mediano; K8s GitOps o AWS solo cuando escala/compliance lo exijan). | Imponer EKS/Kubernetes/microservicios a un MVP o proyecto mediano que corre perfecto en 1–3 VPS. |
| **Honestidad y Validación** | Ejecutar los validadores reales disponibles y reportar con exactitud `CLI_PASS`, `STATIC_VERIFIED`, `NOT_EXECUTED` o `BLOCKED`. | Fingir que corrió un CLI no instalado, ocultar fallos o relajar un validador propio para cantar victoria. |
| **Sincronización** | Actualizar en cascada todos los owners afectados y pasar el Gate 360° de 14 puntos antes de cerrar. | Editar solo `answers.md` o `PROJECT-SUMMARY.md` dejando los módulos/packs contradiciéndolos. |

---

# 47. ZIP release gate

Solo después de los gates anteriores:

1. generar audit;
2. calcular inventory;
3. ZIP;
4. `unzip -t` o equivalente;
5. calcular SHA-256;
6. entregar ZIP + audit.

El audit debe separar:

```text
PASS
FAIL
BLOCKED
NOT_EXECUTED
NOT_APPLICABLE
```

---

# 48. Audit mínimo

```markdown
# Docs Factory Audit

## Project type/mode & Platform Tier
## Human decisions
## Open questions
## External resources
## Toolchain & Vigilio Skills discovered
## Prompt Builder version & target-profile contract mode
## Coverage inventory matrix (expected vs materialized)
## Structural validation
## Schema validation
## Registry/resolver
## Decisions parser
## Plans/DAG
## Template isolation
## Target depth (zero forbidden placeholders/shortcuts)
## 14-Point 360° Cross-file synchronization
## CLI gates (epistemic state per command)
## Project/runtime gates
## NOT_EXECUTED
## Remaining blockers
## ZIP integrity
## SHA-256
## Final status
```

---

# 49. Final status language

No decir solo:

```text
PASS
```

si falta contexto.

Preferir:

```text
DOCS_COMPLETE
STRUCTURAL_PASS
SCHEMA_PASS
RESOLVER_PASS
CLI_PASS
PROJECT_PASS
PUBLICATION_READY
```

o:

```text
NOT_EXECUTED
GAP
BLOCKED
FAIL
```

---

# 50. Recommended invocation

> Apply `senior-docs-factory` + embedded super-skill `senior-exhaustiveness-honesty-sync`.
>
> Create the complete project `docs/` from discovery to final ZIP in Senior Mode with zero shortcuts, radical epistemic honesty and 100% 360° cross-file synchronization.
>
> Before generating the final docs, run the Human Decision Gate. Ask me every unresolved material question that could later block architecture, implementation, UX/UI, security, data, authentication, tenancy, services, accounts, permissions, credentials references, business rules, platform tier/FinOps, deployment, testing or production readiness.
>
> Ask all resolvable questions in a consolidated round with options and a recommended choice. Right-size infrastructure honestly (prefer Tier 1 Docker/Rootless Podman `compose-vps` for simple/medium server projects rather than unnecessary Kubernetes/AWS overhead, unless enterprise scale or compliance requires Tier 2/Tier 3).
>
> Never request secret values; ask only for resource readiness, owner, permissions and secret references.
>
> Do not publish the final ZIP while a material decision remains OPEN.
>
> Build an explicit pre-writing coverage inventory of every module, use case, endpoint, UI screen/state, table/index/constraint, async worker/event, integration, ADR, runbook and prompt pack. Never truncate inventories or use placeholders such as `etc.`, `TBD`, `TODO` or `same as above`; split generation into sequential batches if needed until 100% of targets reach single-target depth.
>
> After decisions are resolved, generate compact-complete docs: full target-specific depth without boilerplate duplication. In greenfield web/API projects, use Zero-`contracts/` OpenAPI target profiles (`mode: openapi` or `mode: none` in Prompt Builder `0.12.1+`) instead of creating artificial `packages/contracts/` directories.
>
> Create `docs/PROJECT-SUMMARY.md` as the compact final map of the finished product: architecture, modules, endpoints, pages/screens, authentication, tenancy, data, seeders, integrations, dev environment, production environment, tests, CI/CD, observability, security, final acceptance and remaining external prerequisites.
>
> Discover the real Prompt Builder/toolchain version (reference baseline `0.12.1`), Vigilio Skills profiles (reference baseline `0.8.3`), schemas, `answers.md` parser grammar, roots, templates and commands before claiming compatibility. Never claim `CLI_PASS` or test execution without actually running the command and inspecting its exit code; report `STATIC_VERIFIED`, `NOT_EXECUTED` or `BLOCKED` with radical honesty when a tool or resource is absent.
>
> Validate decisions, manifests, registry, paths, plans, DAG, templates and locks with the real toolchain when available, and enforce the 14-point 360° Cross-File Synchronization Gate so zero drift exists across `answers.md`, owners, endpoints, UI screens, data schemas, events, registry, plans, target profiles and `PROJECT-SUMMARY.md`.
>
> Keep `docs/` canonical. Treat `generated/` as reproducible output and `.prompt-runner/senior/` as ephemeral execution state. Never repair generated prompts or locks manually.
>
> Build small cohesive prompt packs with stable IDs, explicit dependencies, objective gates and exact concurrency claims. Let Prompt Builder derive deterministic `0001`, `0002`, `0003` ordering from the plan.
>
> Keep every canonical input immutable during an active run. Never let APPLY update the same `docs/rules` source used to compile its REVIEW; perform documentation synchronization as an explicit later change and regenerate affected locks.
>
> Classify test resources before enabling parallelism. Isolate worktrees, temporary paths, coverage, databases, queues, Docker/Podman Compose projects and ports per attempt, or declare their real shared resource as exclusive.
>
> Before leasing work, run or refresh the preflight pinned to the current plan fingerprint and Git base SHA. Execute with Senior Mode using a bounded dynamic pool of isolated workers, phase barriers, heartbeats, deduplicated managed terminal commands, bounded worktree disk cleanup and bounded retries. Keep `--workers 1` compatible with sequential execution, and require one new attached agent chat/session per lease when workers is greater than one.
>
> Do not regenerate or migrate a live legacy queue merely to enable more workers. Preserve progress only through an explicit identity/hash/commit/evidence migration; otherwise fail closed and keep the legacy run serial.
>
> Require one verifiable commit per mutating prompt, changed files inside claims and passing checks. Do not repeat completed siblings when another job fails.
>
> A custom validator is only preflight.
>
> Preserve real blockers; eliminate artificial blockers.
>
> Run a second independent senior review and the 14-point 360° sync audit before packaging.
>
> Deliver ZIP + audit + exact epistemic & compatibility level.

---

# 51. Final principles

> **Human decisions first.**

> **No material OPEN questions before final docs.**

> **Never ask for secrets in cleartext.**

> **Inventory first, zero truncation, zero placeholders.**

> **Compact context, complete semantics.**

> **One rule → one owner → 360° synchronized everywhere.**

> **Every target gets single-target depth.**

> **Zero artificial `contracts/` folders in greenfield; OpenAPI/owner-schemas first.**

> **Right-size platform tiers honestly (FinOps before hype).**

> **PROJECT-SUMMARY is compact; owner docs are complete.**

> **Templates are not product artifacts.**

> **Skills give practices; repositories give physical paths.**

> **Schema-valid is not resolver-valid.**

> **Resolver-valid is not CLI-valid.**

> **CLI-valid is not automatically project-ready.**

> **Radical epistemic honesty: never fake an execution, a read or a PASS.**

> **Zero artificial blockers, never hidden blockers.**

> **Evidence over narrative.**

> **The final ZIP is published only after the Human Decision Gate, 14-Point 360° Sync Gate and Senior Review pass.**

> **`docs/` is canonical, `generated/` is reproducible, runner state is ephemeral.**

> **One prompt → one bounded responsibility → one verifiable result.**

> **Heartbeats prove liveness; commits and checks prove completion.**
