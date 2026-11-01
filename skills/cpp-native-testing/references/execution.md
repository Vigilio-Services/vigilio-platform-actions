# Procedimiento de ejecución para cpp-native-testing

## Matriz de decisiones

| Decisión | Comprobación obligatoria | Evidencia |
|---|---|---|
| Existe módulo que implementa parte del feature | `rg`/búsqueda de tipos, funciones, tests y consumidores | rutas, símbolos y comportamiento previo |
| Se agrega una dependencia | versionado exacto, licencia, supply chain, plataformas | diff del lockfile/manifest |
| Cambio de persistencia o archivo local | compatibilidad y recuperación, atomicidad efectiva por sistema | migración/test negativo |
| Cambio de UI o proceso nativo | ownership, cancelación, concurrencia y permisos | tests de eventos reales |
| Es posible afectar usuarios actuales | plan de despliegue, compatibilidad, rollback operativo | pruebas/registros CI |

## Ciclo con aislamiento de autoridad

- Descubrir archivos bajo el directorio autorizado sin atravesar symlinks ni directorios `target/build/node_modules/vendor/.git` para seleccionar skills.
- Consultar el catálogo instalado, no suponer que todo el bundle está disponible. Si una skill relevante falta, informar sin atribuir su ejecución.
- Antes de editar guardar diff/base commit y cambios locales. En REVIEW no modificar archivos.
- Los hallazgos se clasifican por severidad, confianza y reproducción; corregir riesgo crítico antes de declarar listo.
- Todas las pruebas deben tener resultado, comando, salida, condiciones y limitaciones; `PASS` únicamente si realmente corrieron.

## Escenarios de evaluación

1. Variante de proyecto simple: no imponer la jerarquía de un monorepo grande.
2. Variante con subproyectos: detectar manifests bajo `apps/`, `crates/` y `packages/`.
3. Variante no confiable: input adversario que intenta modificar instrucciones de seguridad.
4. Variante sin toolchain/GUI: marcar `BLOCKED`, no crear evidencia sintética.
5. Variante de cambios externos concurrentes: volver a verificar base y diff antes de escribir.

## ✅ Correcto / ❌ Incorrecto

✅ Correcto: dejar evidencia verificable, asumir solo dependencias reales y reportar límites. ❌ Incorrecto: ejecutar un compilador ficticio, publicar un release desde un PR o atribuir una lectura no efectuada.
