# 06 — Procedimiento de cambios conservadores (preservar cada archivo útil)

## Para auditoría del ZIP o repositorios

1. Elegir versión base: **ZIP reparado más reciente**, no fusionar arbitrariamente copias históricas diferentes.
2. Construir inventario de rutas y hash SHA-256 antes de modificar. Separar fuente, generado, Git, templates, tests, binarios y metadata de ZIP.
3. Leer TODOS los archivos aplicables cuando se solicita auditoría por archivo; registrar cobertura por ruta, propósito, defectos, severidad y evidencia. Los heurísticos (pocas líneas, emojis, headers) solo generan candidatos a inspección humana, **no certifican calidad**.
4. Leer contenido completo de las reglas y de los snippets potencialmente contradictorios; comprobar llamadas, retornos, imports y runtime real, no solo título.
5. Identificar dueño normativo y consumidores, especialmente links relativos instalados por npm, `_sidebar.md`, exports/contract OpenAPI y manifests.
6. Definir diff mínimo. No eliminar/corromper ADR, threat model, playbooks, código histórico útil, decisiones humanas ni ejemplos si aún tienen lectores. Para material obsoleto, marcar como histórico y enlazar la guía vigente.
7. Actualizar documentos canónicos **primero**; después reflejar rutas y workflows en skills. Para snapshots derivados usar mecanismo de regeneración y hashes.
8. Ejecutar pruebas en matriz de ambientes y reportar límites de cada una.
9. Comparar hashes/rutas originales contra el ZIP nuevo, verificar CRC, symlinks y HTML. Revisar que cambios no alteraron binarios/sitio accidentalmente.

## Operaciones y sus dueños

| Cambio | Editar | Evitar |
| --- | --- | --- |
| Norma DDD, SOLID, caché, seguridad | `vigilio-docs/foundations` o `standards` | copiar norma íntegra en 10 skills |
| API pública NestJS | schema Zod canónico, DTO `.pick()`, código, docs stack | schemas duplicados, solo docs sin tests |
| Módulo Laravel | FormRequest, Resource, Use Case, ports/adapters, documentación stack | crear código PHP imaginario sin Composer |
| Cambio de versión | `technology/baselines`, lockfile consumidor autorizado, matriz | anunciar aprobado por leer changelog |
| Cambiar skill | `assets/skills/<name>`, `assets/profiles.json`, tests y referencias | editar `.opencode/skills/` manualmente como fuente |
| Distribución | publicar paquete y fijar release/SHA | considerar ZIP de desarrollo como npm publicado |
| Compatibilidad de documentación | fuente + `_sidebar.md`, validate/build site | editar `_site/` a mano o tocar `index.html` sin necesidad |
| CI reusable | `vigilio-platform-actions` accesible/autorizado | crear copias no versionadas en consumidores |
| OpenSpec | lifecycle del cambio y enlaces canónicos | duplicar reglas humanas en change specs |

## Documentos derivados: política conservadora

- **No editar a mano:** `_site/**`, `assets/docs/**`, `.vigilio-docs/**`, `.vigilio-manifest.json`, `dist/**` cuando se pueda regenerar, `generated/**`, backups o locks controlados.
- **Edición humana protegida:** ADR históricos, `docs/rules/**`, `docs/rules/answers.md`, decisiones humanas trazables, `AGENTS.md` y políticas. Nunca inventar respuesta/aprobación de una pregunta pendiente.
- Cuando el generador no está disponible, dejar el snapshot sin actualizar y marcar `BLOCKED` para release, no simular hashes.
- Si no se dispone del repositorio original de plataforma, especificar ese límite y **no** pretender que las acciones de deploy se validaron.

## Gates de preservación

```text
[ ] Cada archivo original sigue existiendo en el ZIP (salvo eliminación explícita aprobada)
[ ] Los archivos no editados mantienen hash idéntico
[ ] Las modificaciones están listadas con propósito
[ ] HTML: original íntegro; generado reconstruido por script si corresponde
[ ] Sidebar/docs: rutas y enlaces relativos resolubles
[ ] Nuevas skills: profiles, metadata y refs funcionales en consumidor aislado
[ ] Docs snapshot: hashes regenerados/consistentes (no editado a mano)
[ ] npm pack/engines: compatible con baseline elegido
[ ] Código: build/typecheck/tests/contract/integration según impacto
[ ] Reporte preciso PASS/FAIL/NOT_RUN/BLOCKED y permisos faltantes
```

## Safe existente refactoring

- Extraer primero comportamiento observado de tests, rutas, permisos y eventos. No asumir que un helper viejo carece de efectos secundarios.
- Refactor progresivo por feature; conservar HTTP shape, status, paginación, orden, autorización y datos, salvo cambio aprobado con migración.
- Probar N+1 y consultas en PostgreSQL real, cache hit/miss, consumo memoria, latencia y race conditions.
- No sustituir `for...of` secuencial por `Promise.all` masivo sin límites y semántica explícita.
- Auditar que el cambio no agregue PII a logs ni altere el contexto tenant.

## Plantilla de reporte

| Archivo | Antes SHA | Después SHA | Tipo | Impacto |
| --- | --- | --- | --- | --- |
| `stacks/backend/nestjs/...` | hash | hash | modificado | nombre DDD+ejemplo corregido |
| `assets/skills/.../SKILL.md` | — | hash | nuevo | skill maestra |

Informar total de archivos nuevos/modificados/idénticos/eliminados, pero **no** tratar esos conteos como sustitutos de revisión técnica. No falsificar hashes de ejemplo en reportes reales.

> Fuente única para **Navegación canónica multistack 2026**: [abrir documento canónico](../../.vigilio-docs/stacks/backend/nestjs/README.md).


