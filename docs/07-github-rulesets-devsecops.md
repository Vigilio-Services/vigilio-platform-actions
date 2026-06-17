# 🛡️ Guía Definitiva de GitHub Rulesets y DevSecOps (2026)

En la arquitectura DevSecOps moderna, de nada sirve tener pipelines increíbles, linters estrictos y escáneres de seguridad si la "puerta principal" de tu repositorio está abierta. 

Los **GitHub Rulesets** (el reemplazo moderno de las Branch Protection Rules) son la cárcel de máxima seguridad de tu código. Su función es garantizar que absolutamente todo lo que entre a producción (rama `main`) haya pasado por un escrutinio automatizado y humano.

---

## 🚫 La Filosofía de la "Bypass List" (Lista de Evasión)

La regla de oro a nivel Arquitecto: **La Bypass List debe estar vacía.**

1. **Cero Favoritismos:** Si el Tech Lead o el "Repository Admin" se salta las reglas, la cultura de seguridad se rompe. La ley debe aplicar exactamente igual para el programador junior que entró hoy, como para el arquitecto que fundó el proyecto.
2. **Evitar Errores de Madrugada:** Un `git push origin main` tipeado por error a las 3 AM con sueño puede tumbar producción si eres administrador y tienes permisos para saltarte los tests.
3. **Automatización Pura:** Los bots (como Changesets) no necesitan permisos de evasión porque ellos no empujan código a la fuerza; ellos crean Pull Requests educados que respetan las reglas, tal como lo haría un humano.

---

## ⚙️ Configuración Obligatoria (Día 1)

Todo repositorio profesional debe tener este "Ruleset" activo. Para configurarlo, ve a `Settings > Rulesets > New branch ruleset`.

- **Ruleset Name:** `Protect Main` (o algo descriptivo).
- **Enforcement status:** `Active` (Debe estar activo para bloquear, si lo pones en *Evaluate* solo servirá de espía).
- **Target branches:** `Default` (Aplica a la rama `main`).

### Las 4 Reglas de Oro que DEBES Marcar:

1. ✅ **Restrict deletions:** Prohíbe borrar la rama `main`. Evita que alguien ejecute un `git push origin --delete main` por accidente y destruya el ecosistema.
2. ✅ **Block force pushes:** Prohíbe el destructivo comando `git push -f`. Evita que se sobreescriba o reescriba el historial que otros ya tienen descargado.
3. ✅ **Require a pull request before merging:** Mata el "push directo". Obliga a que todo cambio nazca en una rama (`feat/...`, `fix/...`) y se integre mediante un Pull Request.
4. ✅ **Require status checks to pass:** El corazón del CI/CD. Bloquea el botón de Merge si los flujos automatizados fallan. Aquí debes buscar y agregar tus Jobs críticos:
   - `Validate Platform Actions` (Tests y linters).
   - `Secret Scan` (Evita fugas de contraseñas).
   - `Deep Security` (Análisis estático de vulnerabilidades SAST).

---

## 📈 Reglas Recomendadas para Equipos Seniors

Si quieres mantener un código inmaculado, activa también estas reglas:

- 🟢 **Require linear history:** Obliga a que los PRs se fusionen usando **Squash and Merge** o **Rebase**. Elimina los horribles commits de "merge" que parecen fideos cruzados en Git y mantiene tu historial como una sola línea recta, fácil de auditar.
- 🟢 **Require conversation resolution before merging:** Exige que todos los comentarios hechos por colegas (o IAs como CodeRabbit) se marquen como "Resueltos". Evita que los desarrolladores ignoren el feedback y fuercen el merge.
- 🟢 **Require branches to be up to date before merging:** Si `main` avanzó mientras hacías tu PR, GitHub te obligará a traerte los últimos cambios y volver a correr todos los tests antes de dejarte fusionar. Evita bugs de integración de último minuto.

---

## ⚠️ Reglas "Trampa" (Activar solo en casos específicos)

- ❌ **Required approvals:** Solo actívalo si trabajas en equipo. Si eres un desarrollador solitario y lo activas, te bloquearás a ti mismo porque no habrá ningún otro humano que pueda darte el botón verde de "Approve".
- ❌ **Require signed commits:** Exige firmas criptográficas GPG. Es un dolor de cabeza configurarlo en todas las máquinas. Úsalo **solo** si trabajas en empresas altamente reguladas (Fintech, Bancos, Seguros) donde auditoría informática lo exige.
- ❌ **Require code scanning / quality results:** Solo funciona si pagas licencias empresariales caras de *GitHub Advanced Security*. Si usas herramientas Open Source en tus propios workflows (como Trivy y Biome), usa la opción `Require status checks to pass` en su lugar.

---
*Documento generado bajo los más altos estándares de DevSecOps aplicables a 2026.*
