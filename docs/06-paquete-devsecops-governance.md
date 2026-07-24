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

## Publicacion

El workflow `release-package.yml` publica en GitHub Packages cuando se crea un GitHub Release o se ejecuta manualmente.

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
