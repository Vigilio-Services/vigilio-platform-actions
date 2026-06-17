# @vigilio/devsecops-governance

CLI TypeScript para validar reglas DevSecOps compartidas entre repos Vigilio.

## Instalacion

```bash
pnpm add -D @vigilio/devsecops-governance
```

## CLI

```bash
vigilio-governance validate-workflows --workflows-dir .github/workflows
vigilio-governance validate-actions --actions-dir actions
vigilio-governance validate-branch-name --branch-name feat/ABC-123/demo
vigilio-governance validate-pr-title --title "[ABC-123] - feat: Crear demo" --branch-name feat/ABC-123/demo
vigilio-governance validate-pr-body --body "Que cambia: ..."
vigilio-governance validate-commit-message --message "[ABC-123] - feat: Crear demo" --branch-name feat/ABC-123/demo
vigilio-governance validate-stage-source --stage production --ref-name main
```

## Reglas

- Ramas protegidas: `main`, `develop`.
- Ramas de trabajo: `feat/ABC-123/descripcion-corta`.
- Release branch: `release/1.2.0`.
- PR title: `[ABC-123] - feat: Descripcion corta del PR`.
- Commit: `[ABC-123] - feat: descripcion corta`.
