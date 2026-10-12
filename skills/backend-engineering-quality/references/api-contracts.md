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

### Ejemplo Corporativo RRLL Entregado Por El Usuario

Usar este formato cuando el repositorio consumidor adopte la convención `bus-dsg`/`ch-dsg`. No trasladar
automáticamente sus emojis, carpetas, `sigv4` o status a proyectos con otra autoridad.

```yaml
# openapi/paths/endoso/registrar-endoso.yaml
post:
  tags:
    - Endosos RRLL
  summary: Registrar Endoso RRLL
  operationId: crearEndoso
  description: |
    📦 Proceso: Registrar Endoso

    🔧 Funcionalidad: Servicio que permite registrar endosos RRLL.
  parameters:
    - $ref: ../../components/parameters/TraceId.yaml
  requestBody:
    $ref: ../../components/requestBodies/endoso/RegistrarEndosoReq.yaml
  responses:
    '200':
      $ref: ../../components/responses/endoso/RegistrarEndosoRes.yaml
    '400':
      $ref: ../../components/responses/common/BadRequest.yaml
    '500':
      $ref: ../../components/responses/common/InternalServerError.yaml
  security:
    - sigv4: []
```

Los atributos reutilizables documentan significado, ejemplo y restricciones, no solo el tipo:

```yaml
# openapi/components/schemas/attributes/Fecha.yaml
type: string
format: date
description: >
  Fecha de vigencia con formato YYYY-MM-DD.
maxLength: 10
minLength: 10
example: '2026-10-11'
```

El `requestBody` agrega propósito y un caso de prueba sanitizado, reutilizando el modelo propietario:

```yaml
# openapi/components/requestBodies/endoso/RegistrarEndosoReq.yaml
description: Entidad para registrar un endoso RRLL.
required: true
content:
  application/json:
    schema:
      title: Registrar Endoso RRLL
      allOf:
        - description: Entidad de entrada para registrar el endoso.
          title: Registrar Endoso Request
        - $ref: ../../schemas/model_request/RegistrarEndosoReq.yaml
    examples:
      Caso-Prueba-01:
        summary: Registro válido de endoso
        value:
          numeroPoliza: '0001234567'
          fechaVigencia: '2026-10-11'
```

En este perfil, comprobar expresamente:

- `tags` del dominio, `summary` breve y ortografía correcta;
- `operationId` camelCase y único en toda la API;
- `description` con `📦 Proceso` y `🔧 Funcionalidad`;
- `type`, `description`, `example` y constraints aplicables en cada atributo;
- request/response/parameters reutilizados mediante `$ref` relativo y resoluble;
- respuestas mínimas exigidas por el linter del consumidor —en la guía RRLL: `200`, `400`, `500`— y
  cualquier otro status realmente observable;
- security scheme real del repositorio y ejemplos sin secretos ni PII.

El runtime debe implementar exactamente método, path, auth, required/nullability, status y schemas. Si
el repositorio genera OpenAPI desde código, expresar la misma información en sus decoradores/DTOs y
validar el artefacto exportado; si contract-first es autoridad, el YAML y sus componentes son el owner.

Evitar descripciones vacías, respuestas genéricas no implementadas, ejemplos con datos reales, schemas
inline duplicados, referencias absolutas y status que el runtime nunca devuelve.

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
