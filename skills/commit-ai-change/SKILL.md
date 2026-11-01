---
name: commit-ai-change
description: Finaliza un prompt autorizado en uno o varios repositorios Git: resuelve prompt_slug, ticket y rama AI, calcula consumidores afectados con Code Intelligence, ejecuta lint/typecheck/tests/E2E selectivos sin omitir gates obligatorios, stagea solo archivos del scope y crea commits verificables sin push. Usar cuando el usuario o Execution Runner pida cerrar, preparar o commitear un prompt terminado.
owner: governance-platform
lifecycle: stable
introduced_in: 0.7.0
routing_ecosystems: "cross-stack"
routing_keywords: "engineering, standards, governance, commit-ai-change"
routing_files: "package.json"
routing_capabilities: "engineering-standards, governance"
requires: []
optional: []
conflicts: []
supersedes: []
---

<skill-content>

# Commit AI Change

## Lectura obligatoria de referencias

Antes de actuar, leer de principio a fin cada archivo `references/*` enlazado por esta skill. Dentro
de cada referencia aplicable, abrir y leer completas todas las fuentes canónicas enlazadas; no basta
con leer títulos, tablas o resúmenes. Si una fuente requerida no es accesible, identificarla y no
afirmar cumplimiento ni cerrar el gate que dependa de ella.

Crear el commit solo con autorización explícita del usuario o un plan de ejecución que tenga
`commit.enabled: true`. No convertir una tarea de revisión o diagnóstico en una mutación Git.

## Flujo obligatorio

1. Resolver cada Git root con `git rev-parse --show-toplevel`; nunca tratar varios repositorios como
   una transacción Git única.
2. Leer `AGENTS.md`, package manager, scripts, hooks, commitlint/governance, CI path filters y el
   execution lock/allowed paths aplicable.
3. Resolver `prompt_id` y `prompt_slug` desde el execution plan/lock o el nombre del prompt generado.
   Capturar branch, HEAD, status y diff staged/unstaged/untracked. Separar cambios propios del prompt
   de cambios preexistentes o ajenos; bloquear si no pueden aislarse con seguridad.
4. Resolver un ticket `AI-[0-9]{4,}` desde el task/plan/branch. No aceptar otro namespace. Crear o
   verificar una rama con formato `<type>/<ticket_id>/<prompt_slug>` sin resetear ni limpiar worktree.
5. Construir el impact set desde archivos cambiados y consumidores inbound. Preferir el proveedor de
   Code Intelligence (`search_graph`, `trace_path`, `query_graph`) y comprobar su freshness; completar
   con imports, project references, rutas, exports y mapping de tests cuando el grafo no incluye el
   working tree.
6. Seleccionar gates con [references/selective-verification.md](references/selective-verification.md).
   Probar archivos cambiados, tests directos y archivos/rutas que los consumen. Ampliar a package o
   suite completa solo ante una superficie global, grafo incierto o gate requerido por el repositorio.
7. Ejecutar primero gates baratos y luego caros. Un fallo detiene stage/commit; no usar retries,
   snapshots actualizados, coverage reducido ni `--no-verify` para fabricar verde.
8. Ejecutar `git diff --check`. Stagear paths explícitos con `git add -- <path...>`; nunca `git add .`
   ni `git add -A`. Revisar `git diff --cached --name-status` y `git diff --cached` antes del commit.
9. Derivar el mensaje desde el resultado real del prompt y el diff, y validarlo con el comando real
   del repo. El ticket debe coincidir con la rama y `prompt_slug` con el execution lock. Crear un commit
   coherente por prompt completado y Git root; no hacer amend salvo solicitud explícita.
10. Verificar SHA, stat y worktree restante. Reportar evidencia y declarar expresamente `push: no`.

## Identidad prompt, rama y commit

`user-create` no es un valor fijo. Es el `prompt_slug` canónico del prompt en ejecución y enlaza el
plan, la rama, la evidencia y los commits:

```text
prompt_id: 0007-user-create.apply
prompt_slug: user-create
ticket_id: AI-0001
branch: fix/AI-0001/user-create
```

Resolver `prompt_slug` en este orden:

1. Valor explícito e inmutable de `execution-plan.json`/`execution-lock.json`.
2. Stem semántico del archivo de prompt generado, quitando prefijo ordinal y sufijo de fase; por
   ejemplo, `0007-user-create.apply.md` produce `user-create`.
3. Slug registrado del use case/operación cuando el runner ejecuta un prompt materializado sin nombre.

Debe cumplir `^[a-z0-9]+(?:-[a-z0-9]+)*$`. No inferirlo del subject del commit ni reutilizar el slug
de otro prompt. Si falta o existe ambigüedad, usar `BLOCKED: PROMPT_SLUG_REQUIRED`.

Rama canónica:

```text
fix/AI-0001/user-create
feat/AI-0042/settlement-dashboard
```

Tipos permitidos: `feat`, `fix`, `hotfix`, `refactor`, `docs`, `test`, `ci`, `build`, `chore`,
`perf`, `revert`. El tipo debe representar el cambio y normalmente coincide con el tipo del commit.
No inventar `AI-0001` si el repositorio usa un allocator/plan externo; usar
`BLOCKED: AI_TICKET_REQUIRED`.

Los corchetes se usan solo en el mensaje. Git rechaza `[` y `]` en nombres de rama; por eso
`fix/[AI-0001]/user-create` está prohibido.

Formato base de esta arquitectura:

```text
[AI-0001] - fix(users): create user

Prompt-Id: 0007-user-create.apply
Prompt-Slug: user-create
```

Cada prompt que produzca cambios autorizados y supere sus gates genera un commit coherente por Git
root dentro de esa rama. Un prompt sin diff no genera commit. Si varias fases pertenecen al mismo
prompt lógico, conservan `prompt_slug` y pueden crear commits secuenciales solo al completar una unidad
verificable; no se crea un commit por cada comando o microacción.

Los trailers `Prompt-Id` y `Prompt-Slug` enlazan el commit con el prompt exacto y deben coincidir con
el lock y la rama. Si el validator ejecutable del Git root prohíbe trailers, registrar el bloqueo o
usar el mecanismo de metadata versionado por ese repositorio; nunca omitir silenciosamente el vínculo.

El validator ejecutable del Git root decide si el scope es obligatorio, opcional o no soportado. Por
ejemplo, un repo sin scope puede exigir `[AI-0001] - fix: create user`. Mantener siempre el prefijo
`[AI-####]`, el separador/puntuación exigido y un subject concreto; validar antes de commitear.

## Verificación selectiva sin humo

- Lint/format: ejecutar sobre archivos cambiados soportados; ampliar al package si el wrapper no
  acepta paths o cambia configuración compartida.
- Unit/component: usar tests directos y Vitest `related --run` sobre fuentes cambiadas cuando la
  versión instalada lo soporte.
- TypeScript: no invocar `tsc --noEmit` con una lista suelta de archivos ignorando el `tsconfig`.
  Ejecutar `tsc --noEmit -p <affected-tsconfig>` o el script `typecheck` del proyecto afectado;
  aprovechar incremental/project references si está configurado.
- Integration/contract: activar por adapters, persistencia, migraciones, DTOs, OpenAPI, eventos o
  boundaries compartidos afectados.
- E2E: ejecutar spec/tag/project vinculado a las rutas/journeys impactados. Auth, router, providers,
  runtime config o fixtures globales obligan a ampliar el alcance.
- Full suite: reservar para configuración global, package/lockfile, shared library, pipeline, contrato
  transversal, grafo incompleto o policy obligatoria. Optimización nunca significa saltarse riesgo.

## Guardas Git

- No borrar, resetear, stashar ni sobrescribir cambios del usuario.
- No stagear secrets, `.env`, dumps, coverage, artefactos temporales o generados no autorizados.
- No cambiar de base, rebasear, mergear, forcear, taggear, pushear ni abrir PR desde esta skill.
- No commitear si no hay diff, si quedan conflictos, si HEAD está detached sin plan, si falla un
  gate requerido o si el staged diff excede allowed paths.
- En cambios multi-repo, validar y commitear por prompt y por root; registrar SHAs separados y
  conservar el mismo `AI-####`/`product_change_id`/`prompt_slug` cuando representan el mismo prompt
  coordinado.

## Evidencia final

Reportar por Git root:

```text
repository + branch + ticket + prompt_id + prompt_slug
changed paths + impacted consumers/tests
gates ejecutados, comandos y resultado
gates no aplicables con razón verificable
staged paths
commit subject + Prompt-Id/Prompt-Slug trailers + SHA
remaining worktree changes
push: no
```


> Fuente única para **Correcto / Incorrecto: manejo de existente**: [abrir documento canónico](../.vigilio-docs/standards/engineering/refactoring-existing-code.md).

## ✅ Correcto / ❌ Incorrecto — tarea `commit-ai-change`

✅ **Correcto:** en esta tarea, aplicar criterios verificables específicos de esta guía y consultar su owner canónico; remitir la norma compartida al documento propietario.

❌ **Incorrecto:** en esta tarea, copiar reglas de otro stack o declarar evidencia sin haberla ejecutado; inventar pruebas o pegar el mismo procedimiento transversal en varias skills.

