# Guía Práctica: Cómo usar `vigilio-platform-actions` (2026)

Este repositorio no es una aplicación final. Es una **herramienta de plataforma** (un CLI) que los demás repositorios (`bus-impl`, `web-mfe`, etc.) usan para gobernar su calidad y seguridad.

## 1. Estructura del Proyecto

* **`/packages/devsecops-governance/`**: Aquí vive el código real. Es un paquete de Node escrito en TypeScript.
* **`/packages/devsecops-governance/src/`**: Aquí están las políticas (reglas).
* **`/packages/devsecops-governance/tests/`**: Pruebas unitarias en Vitest (obligatorio >95%).
* **`/actions/`**: *(Futuro)* Si creas GitHub Custom Actions.

---

## 2. Cómo agregar un nuevo Script o Regla

Si quieres agregar una nueva validación (ej. validar que todos los commits tengan JIRA ID):

1. **Crea la lógica**: Agrega un archivo `src/jira-policy.ts`.
2. **Escribe el Test**: Crea `tests/jira-policy.test.ts`. Corre `pnpm test` en la raíz para verificar que pase.
3. **Inyéctalo en el CLI**: Abre `src/cli.ts` y agrega el nuevo comando (ej. `validate-jira`).
4. **Prueba localmente**: 
   ```bash
   pnpm build
   node packages/devsecops-governance/dist/cli.js validate-jira
   ```
5. **Comitea usando el estándar**:
   ```bash
   git commit -m "feat: agrega validador de tickets jira"
   ```

---

## 3. Cómo publicar nuevas versiones (Changesets)

Hemos migrado de Semantic Release a **Changesets** porque este repositorio ahora soporta múltiples paquetes independientes (`ui-components`, `logger`, `governance`, etc).

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
6. **Magia automatizada:** El bot de GitHub Actions creará automáticamente un nuevo PR llamado "Version Packages". Cuando lo apruebes, publicará la nueva versión de cada paquete independientemente en GitHub Packages y borrará los archivos de `.changeset/`.

---

## 4. Cómo consumir este paquete en tus otros proyectos

Ve a `bus-impl`, `web-mfe` o `mobile-mfe` y haz esto:

**Paso 1: Eliminar scripts viejos**
Borra la carpeta `scripts/` (si aún tiene `.mjs` sueltos).

**Paso 2: Instalar el paquete**
```bash
# Se instala desde GitHub Packages usando el token de npm
pnpm add -D @vigilio/devsecops-governance
```

**Paso 3: Actualizar el package.json de tu proyecto**
Reemplaza tus viejos scripts con comandos del CLI:
```json
"scripts": {
  "governance:commit": "vigilio-governance validate-pr",
  "governance:actions": "vigilio-governance validate-actions"
}
```

---

## 5. Cómo usar los Reusable Workflows (CI/CD Centralizado)

Este repositorio también centraliza los pipelines de GitHub Actions. Si tienes un microservicio backend, no escribas el pipeline de cero. Llama al flujo central.

**Ejemplo en `bus-impl/.github/workflows/ci.yml`:**
```yaml
name: CI
on:
  push:
    branches: [main]

jobs:
  build-and-test:
    # 👈 Llama al workflow reutilizable de este repositorio
    uses: rimac/vigilio-platform-actions/.github/workflows/shared-backend-node-nest-ci.yml@main
    with:
      # 👈 Puedes personalizar las variables (Inputs)
      node-version: '24.16.0'
      pnpm-version: '11.5.2'
      has-cdk: true
      run-e2e: false
```

Existen flujos ya listos para:
* `shared-backend-node-nest-ci.yml` (APIs Backend)
* `shared-web-mfe-preact-ci.yml` (Frontend Vite)
* `shared-mobile-expo-ci.yml` (Apps React Native)
* `shared-desktop-tauri-ci.yml` (Apps Rust)

¡Eso es todo! Con la librería CLI por un lado y los Workflows por otro, toda tu infraestructura de CI/CD está centralizada al 100%.
