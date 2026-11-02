---
name: platform-compose-vps-delivery
description: Diseña y opera despliegues Cloud-Neutral para proyectos simples a medianos (1-3 VPS) usando un único Docker/Podman Compose endurecido, Caddy TLS, Ansible agnóstico (platform-ops) y backups pgBackRest PITR sin sobreingeniería de Kubernetes.
owner: governance-platform
lifecycle: experimental
introduced_in: 0.8.3
routing_ecosystems: "cross-stack"
routing_keywords: "compose-vps, podman-compose, rootless-podman, podman, caddy, caddyfile, vps, platform-ops, vps-delivery, cloud-neutral-vps, pgbackrest"
routing_files: "Caddyfile, Containerfile.runtime, compose/compose.yaml, compose.yaml"
routing_capabilities: "vps-delivery, compose-orchestration"
requires: []
optional: []
conflicts: []
supersedes: []
---

<skill-content>

# Entrega Cloud-Neutral Con Docker Y Podman Compose (Nivel 1: Proyectos Simples A Medianos)

## Lectura obligatoria de referencias

Lee completamente [references/canonical-contract.md](references/canonical-contract.md).

Abre cada fuente canónica aplicable.

No cierres gates cuando una fuente requerida resulte inaccesible.

## Flujo

1. Separa fronteras en 5 repositorios independientes sin `package.json` ni `contracts/` en la raíz: `apps/<product>-impl`, `apps/<product>-web`, `<product>-deploy` (1 solo `compose/compose.yaml` + `Caddyfile` + `observability/`), `platform-ops` (Ansible agnóstico con `meta/argument_specs.yml` para Rootless Podman) y `prod-local`.
2. Empaqueta una sola imagen backend Distroless non-root (`glibc`, `65532:65532`) que ejecute `api`, `outbox` (`FOR UPDATE SKIP LOCKED`), `worker` (`processed_events` idempotente), `migration` y `platform-setup`; empaqueta el frontend con `Containerfile.runtime` copiando solo `dist/` sin filtrar tokens en capas OCI.
3. Endurece el único `compose.yaml` compartido entre `staging`, `production` y `prod-local` con anchor `x-backend`, digests inmutables `@sha256:...`, `read_only: true`, `cap_drop: [ALL]`, `security_opt: [no-new-privileges:true]`, `tmpfs` (`noexec,nosuid`) y 3 redes aisladas (`edge`, `backend`, `observability`).
4. Verifica firmas Cosign keyless OIDC antes del `pull` en el VPS, ejecuta `migration` bajo `profiles: [tools]` fuera del arranque HTTP y corre smoke tests post-rollout.
5. Configura backups 3-2-1 reales con `pgBackRest` (base backup + archivo continuo WAL PITR en host/sitio independiente) + restore drill semanal aislado, y escala gradualmente (`EXPLAIN ANALYZE` -> `PgBouncer` -> segundo nodo stateless -> hot standby) antes de plantear Kubernetes mediante ADR.

## Qué Hacer Y Qué NO Hacer (Senior Mode)

- ✅ **Hacer:** Usar un único `compose.yaml` parametrizado por `ENV_FILE` y validarlo estáticamente en PR para `local`, `staging` y `production` (`podman compose ... config --quiet`).
- ❌ **No hacer:** Duplicar `docker-compose.staging.yml` y `docker-compose.prod.yml`, meter Kubernetes/Helm/Argo CD para 1–3 VPS sin ADR ni crear carpetas `contracts/` manuales fuera de los módulos propietarios.
- ✅ **Hacer:** Aislar PostgreSQL, Valkey, NATS y almacenamiento S3 interno en la red `backend` sin publicar puertos en `0.0.0.0`, exponiendo únicamente `80/443` en Caddy (`cap_add: [NET_BIND_SERVICE]`).
- ❌ **No hacer:** Confiar en `restart: unless-stopped` o en volúmenes locales de Compose como si fueran backups ante pérdida del host o ransomware.

## Respuesta

Resume primero salud, riesgo y acción.

Usa frases cortas.

Incluye evidencia, costos, pruebas y ejemplos aplicables.

## ✅ Correcto / ❌ Incorrecto: manejo de existente

- ✅ **Correcto:** Consolidar proyectos simples a medianos sobre Rootless Podman/Docker Compose endurecido con digest inmutable, Caddy TLS, `platform-ops` reutilizable y backups `pgBackRest` PITR probados.
- ❌ **Incorrecto:** Introducir sobreingeniería de clústeres Kubernetes sin disparadores medidos, filtrar `NPM_TOKEN` en capas Docker o correr migraciones DDL dentro del arranque de cada réplica HTTP.
- **Gate:** no reescribir masivamente código heredado; inspeccionar baseline, tests y locks reales; reportar `NOT_RUN` si falta evidencia. La guía de refactor se consulta en `vigilio-docs/standards/engineering/refactoring-existing-code.md` según la revisión de Docs aprobada (no asumir que el link remoto `main` ya esté publicado).

</skill-content>

## Guías de librerías por versión — lectura antes de usar sus APIs

Las versiones de esta skill no se copian aquí: comprobar lockfile y [versión canónica](../.vigilio-docs/technology/versions.md). Cuando la tarea utilice una de estas dependencias, **abrir el `.md` completo** y consultar su migración ✅/❌ antes de escribir código; el resto no es obligatorio para una tarea que no la utiliza.

✅ Correcto: versionar el consumidor y seguir los ejemplos de la API instalada; enlazar documento propietario.  ❌ Incorrecto: copiar APIs legacy, duplicar normas en la skill o instalar nuevas dependencias sin gate.
