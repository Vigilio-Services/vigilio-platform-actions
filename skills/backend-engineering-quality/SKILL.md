---
name: backend-engineering-quality
description: Aplica calidad backend reutilizable e independiente del framework para contratos HTTP/OpenAPI, límites BFF, validación, pruebas por riesgo, SQL, migraciones y cambios de datos. Usar al crear o revisar APIs, BFFs, servicios, persistencia o migraciones en Node/Nest, Laravel u otro backend; combinar siempre con la skill específica del stack.
---

<skill-content>

# Calidad De Ingeniería Backend

Esta skill enruta hacia las reglas transversales canonicas de `vigilio-docs` y coordina su aplicacion.
No conserva una segunda copia ni reemplaza las convenciones ejecutables, herramientas, estructura o
comandos de la skill especifica de Node/Nest, Laravel u otro framework.

## Precedencia

1. Instrucciones y configuración ejecutable del repositorio consumidor.
2. Contratos públicos y reglas canónicas de producto vigentes.
3. Skill específica del stack y versión realmente instalada.
4. Esta baseline transversal.

Ante un conflicto, conservar la regla de mayor autoridad y registrar la decisión; no combinar
convenciones incompatibles para aparentar cumplimiento.

## Lectura obligatoria de referencias

Antes de actuar, leer completa únicamente la referencia aplicable al cambio:

- API, BFF, contrato HTTP, OpenAPI o Swagger: [references/api-contracts.md](references/api-contracts.md).
- Tests, regresiones o gates de calidad: [references/testing-strategy.md](references/testing-strategy.md).
- SQL, schema, migraciones, backfill o rollback: [references/data-sql.md](references/data-sql.md).

Cada referencia enlaza su documento canonico de `vigilio-docs`. Si intervienen varias superficies,
leer todas las referencias correspondientes. Despues seguir la skill del stack para elegir librerias,
layout, comandos, thresholds y patrones concretos.

## Flujo

1. Identificar owner, consumidores, invariantes y superficies afectadas.
2. Resolver la skill del stack y comparar con un precedente ejecutable vigente.
3. Aplicar las referencias transversales correspondientes sin importar patrones de otro ecosistema.
4. Ejecutar los gates reales del repositorio y conservar comandos, exit codes y evidencia.
5. Usar `review-code-change` en fase REVIEW; no convertir esta skill de implementación en aprobación.

## Límites

- No prescribe carpetas, ORM, framework de validación, runner de tests ni dialecto SQL.
- No fija porcentajes de cobertura, status HTTP o límites de líneas sin autoridad del proyecto.
- No copia reglas de negocio entre repositorios; referencia su fuente canónica.
- No considera Swagger, un mock verde o documentación narrativa como prueba suficiente del runtime.
- No permite hardcoding, tests debilitados, errores tragados ni evidencia inventada para cerrar gates.

</skill-content>
