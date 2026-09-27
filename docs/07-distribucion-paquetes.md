# Distribucion De Paquetes

## Limites

| Paquete | Responsabilidad | No hace |
| --- | --- | --- |
| `devsecops-governance` | Policies y validadores CI/hook | Copiar archivos o desplegar |
| `devsecops-evidence` | Métricas DORA, SLSA y evidencia operacional | Definir rutas de dominio del consumidor |
| `node-nest-tooling` | Comandos ejecutables Node/Nest | Contener contratos de dominio |
| `web-mfe-tooling` | Contratos, OpenAPI, bundle, runtime config, headers y SBOM Web MFE | Contener UI o valores específicos del consumidor |
| `vigilio-skills` | Skills versionadas | Ejecutar cambios en `postinstall` |

Los contratos OpenAPI de negocio, smoke tests, evidencias y scripts de dominio permanecen en cada
proyecto. Los workflows reutilizables permanecen en `.github/workflows` y se consumen por SHA.

## Arquitectura De Compilacion

Los cuatro paquetes mantienen TypeScript estricto como unica fuente:

```text
src/**/*.ts -> tsc NodeNext -> dist/**/*.js + dist/**/*.d.ts
```

- `src/` y `tests/` no se publican.
- `dist/`, assets necesarios y README forman el paquete npm.
- Los `bin` apuntan a JavaScript compilado en `dist`; el consumidor no instala `tsx`.
- `prepack` reconstruye desde cero para impedir artefactos obsoletos.
- `typecheck`, tests y smoke de tarball se ejecutan antes de publicar.

## Release

1. Agregar Changeset.
2. Pasar lint, typecheck, tests, build, governance y `test:packages`.
3. Fusionar el Release PR generado por Changesets.
4. Publicar los paquetes coordinados en GitHub Packages.
5. Generar tarballs y attestations.
6. Confirmar que `npm view` expone la version antes de migrar consumidores.

No publicar directamente desde una laptop ni reutilizar una version existente.

## Migracion De Consumidor

La migracion ocurre en un PR posterior al release:

```bash
pnpm add -D --save-exact \
  @vigilio-services/devsecops-evidence@0.3.1 \
  @vigilio-services/devsecops-governance@0.5.2 \
  @vigilio-services/node-nest-tooling@0.3.1 \
  @vigilio-services/vigilio-skills@0.6.2

pnpm exec vigilio-skills sync
pnpm exec vigilio-skills check
pnpm install --frozen-lockfile
```

Reemplazar scripts copiados por `vigilio-node <command>`. Mantener exportadores OpenAPI, smoke,
fixtures, seeders y validaciones de dominio dentro del consumidor.

## Compatibilidad

- Versions exactas en consumidores.
- Renovate/Dependabot abre PR de actualizacion; no usar `^`.
- Skills fallan ante archivos modificados y requieren revisión o `--force` deliberado.
- `vigilio-skills check` corre en CI.
- Un cambio breaking requiere major version, guia de migracion y consumer fixture anterior/nuevo.
