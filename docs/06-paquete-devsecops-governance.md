# Paquete DevSecOps Governance

`@vigilioyonatan/devsecops-governance` es el paquete npm privado para compartir validadores entre repos.

## Por que existe

Los YAML de GitHub Actions se reutilizan con reusable workflows, pero las reglas ejecutables como branch naming, PR title, commits, stage source, workflow policy y action policy viven mejor en TypeScript versionado.

## Comandos

```bash
vigilio-governance validate-workflows --workflows-dir .github/workflows
vigilio-governance validate-actions --actions-dir actions
vigilio-governance validate-branch-name --branch-name feat/ABC-123/demo
vigilio-governance validate-pr-title --title "[ABC-123] - feat: Crear demo" --branch-name feat/ABC-123/demo
vigilio-governance validate-pr-body --body "Descripcion real del cambio con contexto suficiente"
vigilio-governance validate-commit-message --message "[ABC-123] - feat: Crear demo" --branch-name feat/ABC-123/demo
vigilio-governance validate-stage-source --stage production --ref-name main
```

Los cambios humanos conservan el ticket obligatorio. La unica excepcion sin ticket es una
promocion GitOps generada por el GitHub App bot configurado: la rama debe ser
`gitops/promote-<development|staging|production>-<digest12>`, el mensaje debe ser
`chore(gitops): promote <workload> to <stage>` y la etapa debe coincidir. El workflow compartido
entrega al validador la rama y el autor real del PR; cambiar solo el texto no permite saltarse la
politica. `--trusted-gitops-actor` solo acepta identidades terminadas en `[bot]`.

## Publicacion

El workflow `release-package.yml` se activa después de un `platform-actions-ci` exitoso
originado por un `push` al branch por defecto. Changesets crea o actualiza el Release PR; al
fusionarlo, el mismo flujo publica en GitHub Packages y genera evidencia. Los repositorios
publicos emiten attestations automaticamente. Un repositorio privado las emite solo cuando el
administrador habilita `PACKAGE_ATTESTATIONS_ENABLED=true` despues de confirmar que GitHub
soporta attestations para ese repositorio. Si no esta habilitado, el workflow registra esa
limitacion sin ocultarla ni fallar una publicacion ya completada.
No consume código de PR, forks ni ejecuciones manuales: verifica el evento `push`, el branch por
defecto y la identidad del repositorio antes de hacer checkout del SHA validado por CI.

Requisitos:

- `packages: write` en GitHub Actions.
- Repo bajo la organizacion `vigilio`.
- `@vigilio` configurado para GitHub Packages.
- Version nueva en `packages/devsecops-governance/package.json`.

## Consumo

```json
{
  "devDependencies": {
    "@vigilioyonatan/devsecops-governance": "1.0.0"
  },
  "scripts": {
    "governance:workflows": "vigilio-governance validate-workflows --workflows-dir .github/workflows"
  }
}
```

## Regla senior

No publicar cambios breaking como `1.x`. Si una regla nueva puede romper repos consumidores, debe ir como opt-in o saltar a `2.0.0`.
