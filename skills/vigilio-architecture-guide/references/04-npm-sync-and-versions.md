# 04 — Cómo funciona realmente npm, el sincronizador y la documentación offline

## Paquete inspeccionado

- Nombre: `@vigilio-services/vigilio-skills`.
- Versión **declarada en el ZIP**: `0.8.0` (candidato **no publicado**). Es un **snapshot de desarrollo**; no afirmar que la release exista en GitHub Packages.
- Registry configurado: **GitHub Packages** (`https://npm.pkg.github.com`, acceso `restricted`). Publicarlo en npmjs.com requiere cambios conscientes y credenciales; nunca afirmar que ya está allí.
- Binario: `vigilio-skills`, compilado ESM en `dist/bin/cli.js` desde `src/bin/cli.ts`.
- Engine declarado: **Node >=24 <25**; no confundir Node del equipo con Node aprobado para el paquete.
- Opciones CLI actuales: `sync|check`, `--root`, `--target`, `--profile` repetible, `--force` y `--dry-run`.

## Flujo real de distribución

```text
vigilio-docs/ (autoría canónica)
      │  build snapshot, hash, compatibilidad
      ▼
vigilio-skills/assets/docs/ + assets/docs-manifest.json
      │                        assets/skills/<task>/SKILL.md
      └───────────────────────────────┘
                      │  publish paquete versionado (si es aprobado)
                      ▼
          consumidor instala paquete npm
                      │  pnpm exec vigilio-skills sync --profile ...
                      ▼
  .opencode/skills/<skill>/SKILL.md
  .opencode/skills/<skill>/references/*.md
  .opencode/skills/.vigilio-docs/<ruta canónica>
  .opencode/skills/.vigilio-manifest.json
```

Destino alternativo: `.agents/skills`. El manifiesto del consumidor registra hashes SHA-256 de **archivos gestionados por el paquete** y la versión reportada. La instalación npm por sí sola **no escribe** en el proyecto consumidor; la sincronización es explícita.

## Comandos seguros

```bash
# Previsualizar ANTES de tocar archivos
pnpm exec vigilio-skills sync --profile core-cross-stack --profile php-laravel --dry-run

# Instalar exactamente los perfiles requeridos
pnpm exec vigilio-skills sync --profile core-cross-stack --profile php-laravel

# Verificar contenido instalado
pnpm exec vigilio-skills check --profile core-cross-stack --profile php-laravel

# Verificar refs del paquete fuente antes de publicar
node scripts/check-doc-references.mjs
```

`sync` compara fuente y hashes, se niega a sobrescribir cambios locales sin `--force` y puede podar archivos previamente gestionados que ya no pertenezcan al perfil. **Nunca usar `--force` sin revisar diff y destino**. Si el usuario quiere preservar personalizaciones, convertirlas en fuente aprobada o resolver el conflicto, no forzar.

## Versiones y gates reales

- `technology/baselines/backend-nestjs.yaml`: upgrade **propuesto** Node LTS/NestJS/Zod; no equivale a upgrade efectivo del consumidor.
- `technology/baselines/backend-laravel.yaml`: consultar `technology/versions.md` como referencia vigente (no duplicar números en la skill); `composer.lock`, extensiones y tests del consumidor deciden aprobación.
- `vigilio-docs/COMPATIBILITY.md` y `compatibility.json` conservan `0.7.0` como última versión **históricamente integrada**. No sustituirla por `0.8.0` hasta validar plataforma, consumidores y publicación real.
- Para npm, `package.json` y lockfile fijan versión. Publicar requiere pruebas Node 24, CLI `sync/check`, pruebas unitarias, integridad de docs-manifest y npm pack.
- Para un cambio de contrato: comparar OpenAPI, correr contract tests y revisar compatibilidad frontend/otros consumidores.
- Para publicación cross-repo: documentar commit exacto de `vigilio-docs`, versión npm publicada, `compatibility.json`, pruebas CI y adopción real del consumidor. No usar enlaces `blob/main` como evidencia inmutable.

## Gotchas verificables

- `check` prueba **integridad del contenido gestionado**, no funcionamiento del backend, calidad de DDD ni instalación correcta de Redis/PostgreSQL.
- Los docs offline incluyen **snapshots**; no editarlos desde `.opencode/skills/.vigilio-docs`, y no editar `assets/docs` como fuente humana.
- `scripts/build-assets.ts` puede presuponer una fuente `vigilio-platform-actions`/workspace; leer el script y asegurarse de que el paquete no borra assets si faltan fuentes antes de ejecutar build en un checkout aislado.
- Los tests de sincronización con fixtures temporales pueden requerir `assets/docs` en el origen. Ejecutar y corregir tests reales, no asumir que suites previas pasan por el éxito de una sincronización aislada.
- El archivo de compatibilidad externa necesita repositorios ajenos al ZIP; informar `BLOCKED/NOT_RUN` cuando falten, nunca inventar un gate `PASS`.

## Enlaces de autoridad

- [Modelo operativo](../../.vigilio-docs/OPERATING-MODEL.md)
- [Compatibilidad](../../.vigilio-docs/COMPATIBILITY.md)
- [Versiones Laravel propuestas](../../.vigilio-docs/technology/baselines/backend-laravel.yaml)
- [Versiones NestJS propuestas](../../.vigilio-docs/technology/baselines/backend-nestjs.yaml)

> Fuente única para **Navegación canónica multistack 2026**: [abrir documento canónico](../../.vigilio-docs/stacks/backend/nestjs/README.md).


