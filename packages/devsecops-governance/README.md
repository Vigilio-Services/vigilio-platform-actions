# @vigilioyonatan/devsecops-governance

CLI TypeScript para validar reglas DevSecOps compartidas entre repos Vigilio.

## Instalacion

```bash
pnpm add -D @vigilioyonatan/devsecops-governance
```

## CLI

```bash
vigilio-governance validate-workflows --workflows-dir .github/workflows
vigilio-governance validate-actions --actions-dir actions
vigilio-governance validate-branch-name --branch-name feat/ABC-123/demo
vigilio-governance validate-pr-title --title "[ABC-123] - feat: Crear demo" --branch-name feat/ABC-123/demo
vigilio-governance validate-pr-body --body "Que cambia: ..."
vigilio-governance validate-pr-risk --body-file event.txt
vigilio-governance validate-commit-message --message-file .git/COMMIT_EDITMSG
vigilio-governance validate-package-manager
vigilio-governance validate-platform-baseline
vigilio-governance validate-repository --policy-file .github/repository-policy.json
vigilio-governance validate-security-exceptions
vigilio-governance audit-github-governance --policy .github/governance-policy.json
vigilio-governance validate-ruleset --ruleset-file node_modules/@vigilioyonatan/devsecops-governance/policies/github/main-branch-ruleset.json
vigilio-governance validate-stage-source --stage production --ref-name main
```

`validate-workflows` uses the `consumer` profile by default. The platform hub validates its required
reusable workflow catalog with `--profile platform`.

## Reglas

- Rama protegida: `main`.
- Ramas de trabajo: `feat/ABC-123/descripcion-corta`.
- Ramas largas `develop` y `release/*`: no validas en trunk-based mode.
- PR title: `[ABC-123] - feat: Descripcion corta del PR`.
- Commit: `[ABC-123] - feat: descripcion corta`.
- Promocion GitOps automatica: `gitops/promote-<stage>-<digest12>` y
  `chore(gitops): promote <workload> to <stage>`, aceptados unicamente cuando el autor del PR es
  el bot configurado mediante `--trusted-gitops-actor` y la etapa coincide entre rama y mensaje.
  El actor confiable debe terminar en `[bot]`; no es una excepcion para commits humanos ni elimina
  el ticket obligatorio del flujo normal.
- Riesgo de PR: rollback, observabilidad, seguridad, datos y compatibilidad declarados.
- Supply chain de pnpm: versiones exactas, integridad y credenciales fuera del repositorio.
- Baseline `node-backend-2026`: Node, pnpm, TypeScript, Biome, Vitest, Semgrep y workflows sin drift.
- Politica local declarativa: archivos y contenido obligatorio por tipo de proyecto.
- Excepciones de seguridad: justificadas, aprobadas y con vencimiento maximo de 30 dias.
- Auditoria GitHub: rulesets, merge queue, revisiones y required checks contra una politica versionada.
- Ruleset compartido: `policies/github/main-branch-ruleset.json`.
- Baseline compartido: `policies/platform/node-backend-2026.json`.
- Required check: `Required CI Gate`.
- Merge Queue: `ALLGREEN`, squash y sin bypass.
