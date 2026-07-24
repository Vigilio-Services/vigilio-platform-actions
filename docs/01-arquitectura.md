# Arquitectura

`vigilio-platform-actions` centraliza automatizaciones comunes sin quitar autonomia a cada repositorio consumidor.

## Capas

```text
.github/workflows/
  reusable workflows por stack

actions/
  composite actions pequenas y reutilizables

scripts/
  reservado para utilidades no publicables

packages/devsecops-governance/
  paquete npm TypeScript con CLI reusable

docs/
  reglas de consumo, versionado y seguridad
```

## Decision senior

No existe un workflow universal. Cada stack tiene su workflow:

- backend Nest/CDK/PostgreSQL
- web MFE Preact/Vite
- mobile Expo/EAS
- desktop Tauri/Rust

Lo comun se reutiliza con composite actions. Lo especifico queda en el workflow del stack.

## Que vive en el repo consumidor

- Secrets y variables por environment.
- Scripts propios del proyecto.
- Configuracion de app.
- Workflows caller pequenos.

## Que vive en este repo

- Flujo CI/CD base.
- Setup Node/pnpm/cache.
- Politica stage/branch.
- Paquete npm `@vigilioyonatan/devsecops-governance`.
- Buenas practicas de deploy por stack.
- Validaciones del propio repo de plataforma.
