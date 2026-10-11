# Estrategia De Pruebas Backend Por Riesgo

## Matriz Transversal

| Cambio | Riesgos mínimos a considerar |
| --- | --- |
| DTO/schema | válido, inválido, límite y normalización |
| servicio de aplicación | éxito, ausencia, conflicto/carrera y fallo de dependencia |
| repositorio | persistencia, mapping, constraint y mutaciones |
| auth/policy | público cuando aplique, ausente, malformado, válido y permiso insuficiente |
| integración externa | mapping de request, éxito, error del proveedor y liberación de recursos |
| endpoint | éxito y errores públicos relevantes según contrato |
| migración | forward, compatibilidad, backfill y rollback/recovery ensayado |
| cache | hit, miss, invalidación y timeout/fallo |

La matriz es un catálogo de riesgos, no una obligación de duplicar todos los casos en todas las capas.
Colocar cada escenario en la capa más barata que pruebe el riesgo real.

## Diseño De Escenarios

- Derivar escenarios del contrato y de riesgos observables: happy path, límite/inválido, vacío o not
  found según semántica, conflicto/concurrencia, autorización y fallo de dependencia.
- Probar la misma cadena de nombres y datos que cruza contrato, parser, schema, controller, servicio y
  adapter. Un unit test aislado no demuestra fidelidad contractual end-to-end.
- Mockear el límite externo más cercano, no las capas propias que se intenta verificar. Para constraints,
  transacciones y SQL, usar la base real aislada exigida por el stack.
- En BDD, expresar comportamiento del negocio y resultados observables; no convertir cada llamada interna
  en un step.
- Mantener fixtures pequeñas, deterministas, tipadas y sin secretos/PII. Separar input público de filas de
  persistencia cuando exista mapper.
- Verificar errores tipados y respuestas públicas directamente. No aceptar cualquier excepción mediante
  `try/catch` ni assertions tolerantes.
- Ejecutar primero el caso afectado y después los gates de la capa. Un mock verde no reemplaza contrato,
  integración o E2E requeridos.

### Ejemplo De Escenarios Sin Duplicación

Para crear una liquidación idempotente:

| Riesgo | Capa más barata suficiente | Evidencia |
| --- | --- | --- |
| importe inválido | unit del schema/validator | rechaza el valor exacto y devuelve error tipado |
| referencia repetida | integration con DB real | unique constraint y mapping a conflicto público |
| proveedor caído | unit del servicio con port mockeado | no confirma estado y conserva causa segura |
| contrato HTTP | E2E/contract | request `201`; duplicado `409`; auth ausente según contrato |

No repetir el mismo happy path en las cuatro capas. Cada test tiene un riesgo, un límite y una salida
observable; los detalles del runner y fixtures pertenecen a la skill del stack.

## Calidad De La Evidencia

- Respetar thresholds y comandos del repositorio; no inventar porcentajes universales.
- Un test de regresión debe fallar sin la corrección y pasar con ella.
- No usar sleeps, retries, `skip` o assertions débiles para ocultar flakiness.
- No afirmar que una capa pasó cuando su base de datos, servicio o infraestructura no estuvo disponible.
- Registrar comando, exit code, alcance ejecutado y cualquier gate omitido o bloqueado.
