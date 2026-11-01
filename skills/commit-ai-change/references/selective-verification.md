# Verificación selectiva para commits AI

## Orden de resolución

```text
git diff/status
→ changed source/config/contracts/tests
→ inbound consumers + direct tests + route/use-case mapping
→ affected package/tsconfig
→ risk escalation
→ cheapest sufficient gates
→ staged diff audit
→ commit validator + hooks
```

El grafo ayuda a encontrar impacto; no sustituye manifest, lockfile, TypeScript, test runner ni CI.
Si el index no incluye cambios no commiteados, completar el set observado leyendo imports/exports y
los tests del working tree.

## Matriz de impacto

| Superficie cambiada | Impacto mínimo | Gates mínimos |
|---|---|---|
| `.md` sin snippets ejecutables | enlaces/estructura/document validator | formatter/validator documental aplicable |
| Fuente pura local | tests directos + importers inbound | lint de paths + affected typecheck + Vitest related/direct |
| Componente/hook frontend | consumidores, route y estados | lint + affected typecheck + component tests; E2E de journey si cambia conducta visible |
| Service/query/mutation | consumers + contrato + cache behavior | lint + affected typecheck + unit/component/MSW + contract cuando aplique |
| Controller/application service | callers, DTOs y ports | lint + affected typecheck + unit + integration/contract del endpoint |
| Repository/schema/migration | servicios, constraints y queries | lint + affected typecheck + DB integration/migration checks; concurrency si aplica |
| Export público/contrato/OpenAPI | todos los consumidores compatibles | producer tests + contract diff + consumer typecheck/tests; ampliar cross-repo según plan |
| Auth/router/provider/runtime config | journeys transversales | package gates + E2E/auth/security relevantes; full si el impacto no se puede aislar |
| `package.json`/lockfile/toolchain | package/workspace completo | install/frozen-lock policy + lint + typecheck + tests + build/audit requeridos |
| CI/IaC/deploy/docker | pipeline/runtime owners | validators de workflow/IaC/image/manifests + smoke según perfil |
| Shared config/library | todos los packages consumidores | project references/affected packages; full suite si el grafo/filtros no son confiables |

## Selección de comandos

Usar scripts del repositorio antes que comandos inventados. Confirmar ayuda/versión si se pasa un
filtro no usado por el repo.

```text
Lint:
  <repo lint tool> <changed supported paths>

Vitest 4:
  vitest related --run <changed source paths>
  vitest run <direct-or-inbound-test-files>

TypeScript:
  tsc --noEmit -p <nearest affected tsconfig>
  o script typecheck del package

Playwright:
  playwright test <mapped spec files>
  o --grep/--project solo si tags/projects son estables y versionados
```

No usar `--passWithNoTests` para presentar una verificación vacía como cobertura. Si `related`
encuentra cero tests, registrar la ausencia y decidir si hace falta un test o un gate más amplio.

## Escalamiento de alcance

Ejecutar suite/package completo cuando ocurra cualquiera:

- cambio en config global, bootstrap, provider, test setup o shared fixture;
- package/lockfile, compiler options, aliases, exports o code generation;
- boundary contractual o persistencia compartida;
- Code Intelligence stale/incompleto y no existe mapping fiable;
- CI/pre-push exige el gate completo;
- fallo selectivo sugiere impacto fuera del set;
- release/hotfix de alto riesgo exige evidence adicional.

Limitar workers/concurrency con opciones versionadas del runner cuando el equipo necesita controlar
RAM. No serializar todo por defecto si el runner ya administra recursos correctamente.

## Cadena de identidad Git AI

```text
prompt:
  prompt_id: 0007-user-create.apply
  prompt_slug: user-create

branch:
  <type>/AI-<4-or-more-digits>/<prompt_slug>

examples:
  fix/AI-0001/user-create
  feat/AI-0042/settlement-dashboard

commit, scope requerido por el repo:
  [AI-0001] - fix(users): create user
  Prompt-Id: 0007-user-create.apply
  Prompt-Slug: user-create

commit, repo sin scope:
  [AI-0001] - fix: create user
```

Separar subject y trailers con una línea vacía en el commit real. `prompt_slug` se obtiene del
prompt/lock y debe cumplir kebab-case; `user-create` es solo un ejemplo.
No derivarlo del subject del commit ni escribirlo como constante global. El ticket se extrae sin
corchetes como `AI-0001` y debe coincidir exactamente en branch, mensaje, evidence y change metadata.
No aceptar `ABC-123`, `JIRA-9` u otro namespace para este flujo. Los corchetes pertenecen al commit;
Git no los admite en un branch ref.

La unidad es un prompt completado por Git root: si ese prompt no modifica archivos, no se crea un
commit; si toca varios roots, se crean SHAs separados enlazados por `ticket_id` y `prompt_slug`.

## Auditoría pre-commit

```text
[ ] un Git root exacto por commit
[ ] prompt_id/prompt_slug resueltos desde el prompt o execution lock
[ ] ticket AI resuelto y branch válida con el prompt_slug exacto
[ ] allowed paths respetados
[ ] no conflictos ni archivos sensibles
[ ] impact set documentado
[ ] gates selectivos suficientes y verdes
[ ] gates completos ejecutados cuando el riesgo/policy lo exige
[ ] staged diff contiene solo el cambio autorizado
[ ] mensaje pasa el validator real
[ ] trailers Prompt-Id/Prompt-Slug coinciden con lock y branch, o existe bloqueo/policy explícita
[ ] hooks habilitados
[ ] SHA, prompt_id, prompt_slug y cambios restantes reportados
[ ] no push
```

> Fuente única para **Correcto / Incorrecto: manejo de existente**: [abrir documento canónico](../../.vigilio-docs/standards/engineering/refactoring-existing-code.md).

