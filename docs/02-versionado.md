# Versionado

Los repos consumidores deben fijar el SHA completo de un commit inmutable y conservar una etiqueta legible como comentario. El SHA bootstrap de los ejemplos debe actualizarse mediante PR cuando se publique una revisión compatible.

Correcto:

```yaml
uses: Vigilio-Services/vigilio-platform-actions/.github/workflows/shared-backend-node-nest-ci.yml@d497eac9dac8aa90545a9bf1b54191c11c7f4e3e # bootstrap pin
```

No permitido:

```yaml
uses: Vigilio-Services/vigilio-platform-actions/.github/workflows/shared-backend-node-nest-ci.yml@main
uses: Vigilio-Services/vigilio-platform-actions/.github/workflows/shared-backend-node-nest-ci.yml@latest
uses: Vigilio-Services/vigilio-platform-actions/.github/workflows/shared-backend-node-nest-ci.yml@v1
uses: Vigilio-Services/vigilio-platform-actions/.github/workflows/shared-backend-node-nest-ci.yml@v1.2.3
```

## Politica de compatibilidad

- `v1`: cambios compatibles hacia atras.
- `v1.1.0`: nueva funcionalidad opcional.
- `v1.1.1`: bugfix.
- `v2`: breaking changes.
- El tag describe la compatibilidad; el workflow ejecuta el SHA asociado y Dependabot propone actualizaciones.

## Proceso de release

1. Merge a `main`.
2. Ejecutar CI del repo central.
3. Crear GitHub Release.
4. Crear tag `v1.x.y`.
5. Mover tag mayor `v1` solo si el cambio es compatible.
6. Abrir PRs en consumidores para actualizar el SHA, sin moverlos silenciosamente.

## Regla de oro

Nunca romper consumidores silenciosamente. Si un cambio exige nuevos secrets, nuevos scripts o nuevos permisos, es breaking change salvo que tenga fallback.
