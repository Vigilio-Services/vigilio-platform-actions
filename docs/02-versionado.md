# Versionado

Los repos consumidores deben usar tags versionados.

Correcto:

```yaml
uses: VigilioYonatan/vigilio-platform-actions/.github/workflows/shared-backend-node-nest-ci.yml@v1
```

Mejor para releases criticos:

```yaml
uses: VigilioYonatan/vigilio-platform-actions/.github/workflows/shared-backend-node-nest-ci.yml@v1.2.3
```

No permitido:

```yaml
uses: VigilioYonatan/vigilio-platform-actions/.github/workflows/shared-backend-node-nest-ci.yml@main
uses: VigilioYonatan/vigilio-platform-actions/.github/workflows/shared-backend-node-nest-ci.yml@latest
```

## Politica de compatibilidad

- `v1`: cambios compatibles hacia atras.
- `v1.1.0`: nueva funcionalidad opcional.
- `v1.1.1`: bugfix.
- `v2`: breaking changes.

## Proceso de release

1. Merge a `main`.
2. Ejecutar CI del repo central.
3. Crear GitHub Release.
4. Crear tag `v1.x.y`.
5. Mover tag mayor `v1` solo si el cambio es compatible.

## Regla de oro

Nunca romper consumidores silenciosamente. Si un cambio exige nuevos secrets, nuevos scripts o nuevos permisos, es breaking change salvo que tenga fallback.
