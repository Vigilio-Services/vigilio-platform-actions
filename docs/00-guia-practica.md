# Guía Práctica: Cómo usar `vigilio-platform-actions` (2026)

Este repositorio no es una aplicación final. Es el hub de plataforma que distribuye paquetes npm,
GitHub Actions, reusable workflows y skills para `bus-impl`, `web-mfe`, mobile y desktop.

## 1. Estructura del Proyecto

- **`packages/devsecops-governance/`**: políticas ejecutables de repositorio, PR, workflows,
  package manager, baseline y GitHub.
- **`packages/devsecops-evidence/`**: DORA, evidencia operacional y procedencia SLSA.
- **`packages/node-nest-tooling/`**: tooling reutilizable exclusivo de Node/Nest.
- **`packages/vigilio-skills/`**: distribución y sincronización explícita de skills.
- **`actions/`**: acciones compuestas y la acción TypeScript de Jira.
- **`.github/workflows/shared-*.yml`**: reusable workflows por stack.
- **`skills/`**: fuente canónica de skills; el consumidor recibe solo los perfiles seleccionados.

---

## 2. Cómo agregar un nuevo Script o Regla

Si quieres agregar una validación:

1. Ubícala en el paquete propietario; no mezcles evidencia, governance y tooling Node/Nest.
2. Agrega tests unitarios y de CLI.
3. Expón el comando en el CLI del paquete.
4. Valida desde la raíz:
   ```bash
   pnpm lint
   pnpm typecheck
   pnpm test
   pnpm build
   pnpm test:packages
   ```
5. Agrega un Changeset y usa Conventional Commits:
   ```bash
   pnpm changeset
   git commit -m "[PLAT-123] - feat: agrega politica de governance"
   ```

---

## 3. Cómo publicar nuevas versiones (Changesets)

Changesets coordina las versiones de los cuatro paquetes del workspace.

¡No cambies el `package.json` a mano! Sigue este flujo:

1. Haz tus cambios en el código.
2. Abre tu terminal y corre:
   ```bash
   pnpm changeset
   ```
3. El asistente te preguntará:
   - ¿A qué paquetes le hiciste cambios? (Selecciona con la barra espaciadora).
   - ¿Es un cambio mayor (Major), menor (Minor) o parche (Patch)?
   - Escribe un resumen de tu cambio.
4. Esto generará un archivo markdown en la carpeta `.changeset/`. Agrégalo a tu commit (`git add .changeset/`).
5. Abre tu Pull Request y haz merge a `main`.
6. El push a `main` ejecuta `release-package.yml`. Changesets abre o actualiza el Release PR.
7. Al fusionar el Release PR, el workflow publica en GitHub Packages y genera tarballs, SBOM y
   attestations.
8. Verifica la versión publicada antes de modificar consumidores. No publiques desde una laptop.

---

## 4. Cómo consumir los paquetes

Configura el scope `@vigilioyonatan` en el `.npmrc` versionado y la credencial en `~/.npmrc` o CI.
Instala solo paquetes compatibles con el stack y fija versiones exactas:

```bash
pnpm add -D --save-exact \
  @vigilioyonatan/devsecops-governance@0.1.0 \
  @vigilioyonatan/devsecops-evidence@0.1.0 \
  @vigilioyonatan/vigilio-skills@0.1.0
```

Agrega `@vigilioyonatan/node-nest-tooling` únicamente en backends Node/Nest. Migra comandos
reutilizables uno por uno. Conserva scripts de dominio, fixtures, seeders, smoke tests y lógica
específica del proyecto. Nunca borres `scripts/` completa por una migración de plataforma.

Las skills no se copian en `postinstall`:

```bash
pnpm skills:sync
pnpm skills:check
```

---

## 5. Cómo usar los Reusable Workflows (CI/CD Centralizado)

Los proyectos pueden llamar workflows centrales cuando existe paridad con sus gates locales.

**Ejemplo en `bus-impl/.github/workflows/ci.yml`:**
```yaml
name: CI
on:
  push:
    branches: [main]

jobs:
  build-and-test:
    uses: Vigilio-Services/vigilio-platform-actions/.github/workflows/shared-backend-node-nest-ci.yml@d497eac9dac8aa90545a9bf1b54191c11c7f4e3e # bootstrap pin
    with:
      node-version: '24.16.0'
      pnpm-version: '11.7.0'
      has-cdk: true
      run-e2e: false
```

Existen familias para backend Node/Nest, web Preact, mobile Expo y desktop Tauri. Siempre fija el
reusable workflow a un SHA publicado. El consumidor conserva wrappers de stage, comandos de dominio
y cualquier gate que aún no tenga paridad central demostrada.

La centralización correcta no significa cero archivos locales: significa una sola fuente para
controles reutilizables y ownership local para comportamiento propio del producto.
