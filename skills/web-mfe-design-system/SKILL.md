---
name: web-mfe-design-system
description: Construye y revisa design systems frontend con tokens, temas, primitivas accesibles, APIs de componentes, libs/ui, UI privada de features, responsive y visual regression. Usar al crear o promover componentes reutilizables, estandarizar estilos, formularios, modales, tablas, dark mode, design tokens o corregir inconsistencias visuales y de accesibilidad entre aplicaciones/features.
---

<skill-content>

# Design System Web MFE

Usar la documentación canónica; no copiar catálogos de componentes ni reglas de tokens dentro de la skill.

## Flujo obligatorio

1. Leer [references/canonical-docs.md](references/canonical-docs.md).
2. Auditar `libs/ui`, tokens, estilos globales y componentes privados existentes antes de crear otra abstracción.
3. Mantener la pieza dentro de `features/{feature}/components/ui` hasta demostrar reutilización real.
4. Promover a `libs/ui` solo con API agnóstica de dominio, dos consumidores y ownership claro.
5. Diseñar primero semántica, teclado, focus, estados y tokens; después variantes visuales.
6. Mantener componentes libres de HTTP, TanStack Query, stores, DTOs y reglas de negocio.
7. Colocar tests de comportamiento junto al runtime y visual regression cuando exista riesgo visual.
8. Medir impacto de bundle/render y documentar breaking changes/rollout cuando la API compartida cambie.

## Coordinación

- Invocar `web-mfe-quality` para WCAG, SEO visible, performance y bundle.
- Invocar `web-mfe-testing` para componentes, teclado, visuales y coverage.
- Invocar `web-mfe-build-feature` cuando la UI permanece específica de un caso de uso.
- Usar OpenSpec para cambios breaking del sistema compartido o migraciones entre aplicaciones.

</skill-content>
