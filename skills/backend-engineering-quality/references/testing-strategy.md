# Estrategia De Pruebas Backend Por Riesgo

## Fuente Canonica

Leer completa la guia
[Estrategia backend de pruebas por riesgo](https://github.com/VigilioYonatan/vigilio-docs/blob/main/software-factory/backend-testing-strategy.md).
Alli viven la matriz de riesgos, seleccion de capas, diseño de escenarios, ejemplo sin duplicacion y
calidad de evidencia. Esta referencia no mantiene una segunda copia.

## Uso Desde La Skill

1. Derivar riesgos y resultados observables del cambio.
2. Resolver la skill del stack para runner, fixtures, thresholds y comandos.
3. Ejecutar primero el caso afectado y despues los gates aplicables.
4. Registrar comando, exit code, alcance y cualquier bloqueo real.
