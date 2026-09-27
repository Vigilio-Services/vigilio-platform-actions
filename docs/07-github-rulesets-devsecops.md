# GitHub Rulesets y Merge Queue

La politica central esta en:

`packages/devsecops-governance/policies/github/main-branch-ruleset.json`

El archivo es un body valido para la API de repository rulesets y se distribuye dentro de
`@vigilio-services/devsecops-governance`.

## Controles obligatorios

- Rama objetivo: `~DEFAULT_BRANCH`.
- Enforcement: `active`.
- Bypass: ninguno.
- Sin borrado ni force push.
- Historial lineal y merge exclusivo por squash.
- Pull request obligatorio.
- Una aprobacion, revision de CODEOWNERS y aprobacion del ultimo push.
- Conversaciones resueltas.
- Un unico required check estable: `Required CI Gate`.
- Merge Queue en modo `ALLGREEN`.

## Contrato del repositorio consumidor

El workflow principal debe:

1. Ejecutarse en `pull_request`, `push` a la rama principal y `merge_group`.
2. Publicar siempre un job llamado `Required CI Gate`.
3. Hacer que ese gate falle si un job obligatorio falla o se cancela.
4. Permitir `skipped` solamente para jobs condicionales definidos por path filtering.
5. Ejecutar la suite completa en eventos `merge_group`.

Validacion local:

```bash
vigilio-governance validate-ruleset \
  --ruleset-file node_modules/@vigilio-services/devsecops-governance/policies/github/main-branch-ruleset.json
```

## Activacion

La activacion requiere permisos `Administration: write` del repositorio. Puede importarse desde
`Settings > Rules > Rulesets` o enviarse con:

```bash
gh api --method POST \
  -H "X-GitHub-Api-Version: 2026-03-10" \
  "repos/OWNER/REPO/rulesets" \
  --input packages/devsecops-governance/policies/github/main-branch-ruleset.json
```

No guardar tokens de administracion en el repositorio. Para automatizar varios repositorios, usar
una GitHub App con permisos minimos y auditar sus cambios.

## Compatibilidad

Merge Queue esta disponible para repositorios publicos de organizaciones y para repositorios
privados de organizaciones con GitHub Enterprise Cloud. Cuando el plan no la soporte:

1. Eliminar solo la regla `merge_queue` de una copia del JSON.
2. Cambiar `strict_required_status_checks_policy` a `true`.
3. Mantener `Required CI Gate` como required check.

La proteccion sigue obligando a probar el PR contra la ultima rama principal, pero la
homologacion puede requerir una actualizacion manual.

Referencias:

- https://docs.github.com/en/rest/repos/rules
- https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/configuring-pull-request-merges/managing-a-merge-queue
