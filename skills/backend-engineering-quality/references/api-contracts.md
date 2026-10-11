# Contratos API Y Límites Backend

## Fidelidad Del Contrato Al Runtime

Antes de cambiar un endpoint, construir una matriz breve con evidencia real de cada superficie:

| Superficie | Debe coincidir con |
| --- | --- |
| método y path públicos | router/controller y OpenAPI exportado |
| identificador de operación | handler/controller propietario, cuando el runtime lo use |
| path/query/header/body | parser, schema runtime, DTO y controller |
| required, optional y nullable | contrato runtime y tipos efectivos |
| response y errores | contrato de salida, errores públicos y status observables |
| auth y permisos | middleware/guards/policies, security scheme y pruebas |
| consumidor | package o contrato exacto del perfil y pruebas de compatibilidad |

Un mismatch es un defecto contractual aunque cada repositorio compile por separado. Preservar paths y
operaciones públicas aprobadas; una URI aparentemente más elegante no justifica un breaking change sin
versionado y migración coordinada.

## BFF O Canal

- Orquestar y adaptar el contrato del cliente sin absorber persistencia ni reglas de negocio del backend
  propietario.
- No acceder directamente a la base de datos salvo autoridad explícita del proyecto.
- Mantener trazabilidad de método, path, operación, DTO, headers y errores entre canal y servicio owner.
- Simular el límite externo más cercano en unit tests y cubrir la compatibilidad real mediante contract o
  integration tests según el riesgo.

## OpenAPI Y Documentación Ejecutable

- Mantener `operationId` único y estable cuando el ecosistema lo utilice.
- Documentar tipos, formatos, constraints, required/nullability, ejemplos sanitizados, auth y errores que
  el runtime realmente expone.
- Reutilizar components solo cuando la semántica sea la misma; no deduplicar campos parecidos con reglas
  distintas.
- Usar referencias resolubles y rutas portables. No editar bundles generados como fuente.
- Incluir los status relevantes por comportamiento y riesgo; no imponer siempre `200/400/500` si el
  contrato real requiere otros.
- Ejecutar lint, bundle/export y diff breaking con las herramientas y severidades del repositorio.
- Tratar Swagger o Scalar como representaciones del contrato, no como evidencia de funcionamiento.

## Fronteras, Errores Y Observabilidad

- Validar todo input no confiable al entrar; después trabajar con datos parseados y tipados.
- Capturar errores solo donde exista responsabilidad real de traducir, enriquecer, compensar o liberar
  recursos. No agregar `try/catch` ceremonial en cada capa.
- Preservar errores de dominio conocidos y traducir fallos desconocidos a una respuesta pública estable,
  sin stack traces ni detalles internos.
- Loguear acción, resultado, latencia e identificadores de correlación no sensibles. No serializar bodies,
  tokens, secretos o PII por conveniencia.
- Mantener handler/controller delgado, aplicación como orquestador y adapters como dueños de I/O.

## Evidencia Mínima

- Matriz contrato-runtime sin drift entre owner, implementación y consumidor.
- Validación de contrato y diff breaking ejecutados cuando existan en el repositorio.
- Pruebas de los comportamientos y errores públicos afectados.
- Autorización y documentación de cualquier breaking change intencional.
