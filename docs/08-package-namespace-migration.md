# Migración del namespace de paquetes

Los paquetes de la plataforma se publican bajo `@vigilio-services/*`, el mismo owner que el repositorio y su workflow de release. Esta alineación permite usar el `GITHUB_TOKEN` efímero y limitado al repositorio, sin un PAT personal con acceso global a repositorios privados.

## Mapeo

| Anterior | Canónico |
| --- | --- |
| `@vigilioyonatan/devsecops-evidence` | `@vigilio-services/devsecops-evidence` |
| `@vigilioyonatan/devsecops-governance` | `@vigilio-services/devsecops-governance` |
| `@vigilioyonatan/node-nest-tooling` | `@vigilio-services/node-nest-tooling` |
| `@vigilioyonatan/prompt-builder` | `@vigilio-services/prompt-builder` |
| `@vigilioyonatan/vigilio-skills` | `@vigilio-services/vigilio-skills` |
| `@vigilioyonatan/web-mfe-tooling` | `@vigilio-services/web-mfe-tooling` |

## Estrategia de transición

1. Publicar los paquetes nuevos desde `Vigilio-Services/vigilio-platform-actions` usando `GITHUB_TOKEN` con `packages: write`.
2. Mantener las versiones existentes de `@vigilioyonatan/*` sin eliminarlas ni cambiar su visibilidad.
3. Migrar cada repositorio consumidor mediante un PR independiente: dependencia, imports, configuración, lockfile y pruebas afectadas.
4. No publicar nuevas versiones en el namespace personal.
5. Retirar referencias antiguas únicamente después de verificar que ningún consumidor activo depende de ellas.

## Seguridad y rollback

- No se usa PAT personal ni secreto de larga duración para GitHub Packages.
- El token de publicación es efímero y solo existe durante el job de GitHub Actions.
- El GitHub App de release conserva únicamente la creación/actualización del PR de Changesets.
- Si la publicación organizacional falla, los paquetes antiguos siguen disponibles y los consumidores no se modifican.
- Está prohibido borrar versiones antiguas como parte de esta migración.
