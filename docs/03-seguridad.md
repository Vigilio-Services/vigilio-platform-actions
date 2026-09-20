# Seguridad

## Reglas

- No guardar secrets en este repo.
- No usar `pull_request_target`.
- Fijar toda action o reusable workflow remoto a SHA completo; tags y branches son solo referencias humanas.
- Usar `persist-credentials: false` en checkout.
- Declarar `permissions` explicitos.
- Usar `id-token: write` solo para OIDC cloud o attestations.
- Production debe correr desde `main` y con GitHub Environment approval.

## Secrets

Los secrets viven en:

- repo consumidor;
- organization secrets;
- GitHub Environments;
- AWS IAM OIDC trust policy por environment.

Este repo solo define contratos de inputs/secrets.

En reusable workflows, un secret de GitHub Environment no se pasa desde el caller. El caller puede
enviar el rol OIDC read-only de plan; el rol de escritura debe existir como `AWS_APPLY_ROLE_ARN` en
el Environment seleccionado por el job protegido del workflow reutilizable. Esto evita que el
preflight reciba credenciales de apply antes de la aprobación.

## Repo privado

Puede ser privado. En GitHub:

```text
vigilio-platform-actions
  Settings
  Actions
  General
  Access
```

Permitir que repos de la organizacion usen los reusable workflows.

## Reglas para consumidores publicos

Si un repo consumidor es publico, no exponer secrets en PRs de forks. Mantener deploys solo en push protegido o workflow manual con environment approval.
