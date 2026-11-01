---
name: review-code-change
description: Revisa diffs, pull requests o implementaciones terminadas con evidencia y severidad, alineando codigo, contratos y gates con docs/rules y OpenSpec. Usar solo cuando se solicite code review, revision de PR, readiness para merge o la fase REVIEW; no usar para implementar o corregir cambios.
owner: governance-platform
lifecycle: stable
introduced_in: 0.7.0
routing_ecosystems: "cross-stack"
routing_keywords: "engineering, standards, governance, review-code-change"
routing_files: "package.json"
routing_capabilities: "engineering-standards, governance"
requires: []
optional: []
conflicts: []
supersedes: []
---

# Review Code Change

## Lectura obligatoria de referencias

Antes de actuar, leer de principio a fin cada archivo `references/*` enlazado por esta skill. Dentro
de cada referencia aplicable, abrir y leer completas todas las fuentes canónicas enlazadas; no basta
con leer títulos, tablas o resúmenes. Si una fuente requerida no es accesible, identificarla y no
afirmar cumplimiento ni cerrar el gate que dependa de ella.

Evalúa si un cambio es seguro para avanzar. Prioriza defectos reales, regresiones, vulnerabilidades,
rupturas de contrato e incumplimientos verificables; no convierte preferencias personales en hallazgos.

## Límite de fase

- Ejecutar este workflow únicamente para una revisión solicitada o una fase `review`.
- Revisar es una operación de inspección: no modificar código, configuración, documentación ni estado externo.
- No adelantar `fix`. Si existen hallazgos, documentar el alcance mínimo y el gate que debe revalidarse.
- Si el prompt generado define `allowed_paths`, `forbidden_paths`, locks, dependencias o gates, tratarlos
  como límites obligatorios.
- No revisar trabajo dependiente como completo mientras una fase o dependencia anterior esté bloqueada.

## Autoridad y contexto

Separar autoridad normativa de evidencia de implementación:

1. `docs/rules/**` posee las reglas funcionales y técnicas manuales del producto.
2. OpenSpec posee el ciclo temporal del cambio y referencia la autoridad canónica; no reemplaza ni
   contradice `docs/rules/**`.
3. ADRs y runbooks vigentes gobiernan decisiones y operación dentro de su alcance.
4. Código, contratos ejecutables, lockfiles, pruebas, reportes y telemetría demuestran lo implementado.
5. Para versiones o APIs de tecnología, preferir resolución real, manifests, lockfiles, exports y
   documentación oficial de la versión antes que memoria del modelo.
6. Las convenciones no documentadas requieren evidencia repetida en el repositorio; un único archivo
   no establece una regla.

No copiar reglas de negocio al informe. Citar su ID o ubicación canónica y explicar la desviación.

## Preparar la revisión

1. Identificar el objetivo del cambio, repositorio, base y head reales. No inventar la rama base.
2. Obtener el diff exacto y clasificar archivos agregados, modificados, renombrados y eliminados.
3. Limitar los hallazgos al diff. Consultar archivos fuera del diff solo para rastrear impacto,
   contratos, call sites, precedentes y arquitectura.
4. Leer las instrucciones del repositorio y el contexto mínimo aplicable: pack de `docs/rules`, cambio
   OpenSpec, ADR, target profile, locks y gates.
5. Activar únicamente skills especializadas exigidas por el cambio. Una skill de testing, contratos,
   seguridad, frontend o persistencia aporta criterios propios; esta skill coordina y evita duplicarlos.
6. Si no existe diff verificable, registrar `MISSING_REVIEW_TARGET` y no fingir una revisión completa.

## Revisar por riesgo

Comprobar solo categorías aplicables:

- Corrección y reglas de negocio: invariantes, estados, errores, concurrencia e idempotencia.
- Contratos y compatibilidad: API, eventos, schemas, serialización y consumidores.
- Seguridad y privacidad: autorización, aislamiento, validación, secretos, PII y supply chain.
- Datos y migraciones: atomicidad, compatibilidad, rollback y riesgo de pérdida.
- Arquitectura: responsabilidades, dependencias, ownership y separación de capas.
- Calidad y mantenibilidad: complejidad que causa riesgo, duplicación material y manejo de errores.
- Pruebas: cobertura del comportamiento modificado, regresiones y determinismo.
- Rendimiento: N+1 visible, trabajo no acotado, recursos no liberados, bloqueo o payloads materiales.
- Observabilidad y operación: señales accionables, redacción, correlación, despliegue y recuperación.

No afirmar problemas de índices, planes de ejecución, capacidad o producción sin evidencia real.

## Validar cada hallazgo

Un hallazgo requiere simultáneamente:

- ubicación concreta en el diff o efecto directo trazable desde él;
- evidencia reproducible o razonamiento causal específico;
- autoridad aplicable o invariante técnico verificable;
- impacto real para usuario, negocio, seguridad, operación o mantenimiento;
- recomendación acotada y un método de verificación.

Asignar confianza `ALTA`, `MEDIA` o `BAJA`. Omitir hipótesis débiles que no sean accionables; cuando
falte evidencia requerida por un gate, registrarla como evidencia ausente, no como prueba de fallo.

## Severidad y veredicto

- `BLOQUEANTE`: riesgo crítico, decisión humana pendiente, pérdida/corrupción de datos, vulnerabilidad
  explotable, ruptura contractual grave, migración irreversible insegura o invariante material violada.
- `ALTA`: defecto probable que impide aprobar el cambio y necesita `fix` antes del merge.
- `MEDIA`: problema real y acotado que debe corregirse, sin riesgo crítico inmediato.
- `BAJA`: mejora objetiva de bajo impacto; no bloquear por estilo ya cubierto por herramientas.

Veredicto:

- `APPROVE`: ningún hallazgo bloqueante/alto/medio pendiente y todos los gates exigidos tienen evidencia.
- `REQUEST_CHANGES`: existe al menos un defecto corregible dentro del alcance; requiere fase `fix` y
  posterior `review`.
- `BLOCK`: falta autoridad, decisión, dependencia o evidencia crítica, o el arreglo excede el alcance
  aprobado; requiere intervención humana o replanning.

Cuando exista un contrato de orquestación, mapear sin alterar sus marcadores:

- `APPROVE` → `READY` solo con evidencia verificable.
- `REQUEST_CHANGES` → `QUALITY_FAILED` y `BLOCKED` hasta completar `fix` + nueva revisión.
- `BLOCK` → `NEEDS_HUMAN_REVIEW` y `BLOCKED`.

## Evitar falsos positivos

- No reportar problemas preexistentes sin impacto directo del cambio.
- No exigir tecnologías, patrones, cobertura o estilos que la autoridad del proyecto no adopta.
- No asumir que documentación narrativa prueba comportamiento runtime.
- No marcar como PASS un gate no ejecutado, omitido, inestable o sin reporte verificable.
- No incluir secretos, tokens, PII o payloads sensibles en evidencia ni ejemplos.
- No usar el número de archivos o líneas como sustituto del análisis de riesgo.

## Entrega

Antes de responder, leer y usar [references/review-format.md](references/review-format.md). Ordenar los
hallazgos por severidad y luego por archivo/línea. Si no hay hallazgos, decirlo explícitamente y
mantener una sección breve de riesgos residuales o evidencia no disponible.

> Fuente única para **Correcto / Incorrecto: manejo de existente**: [abrir documento canónico](../.vigilio-docs/standards/engineering/refactoring-existing-code.md).




## Alineación vigente Vigilio — 2026

- Fuente de verdad: [Naming/DDD y conservación](../.vigilio-docs/standards/engineering/naming-and-boundaries.md). Leerla **antes** de crear/refactorizar contratos y justificar cualquier excepción por interfaz externa.
- ✅ Métodos de negocio `listProducts`, `getProduct`, `registerProduct`, `approvePolicy`, `cancelOrder`; Domain `approve/cancel/activate`; Repository `findById/save/findByCriteria`. Datos/vars/parámetros/columnas `snake_case`, tipos/clases `PascalCase`, métodos `camelCase`.
- ✅ Zod: `ProductSchema['id']`, `OrderSchema['status']`, tipos internos `Pick`/intersecciones y DTOs derivados de schema; Laravel: enums nativos, Spatie Data para contratos, Eloquent SQL.
- ❌ No imponer `index/show/store/update/destroy` para casos de uso ni `tenantId` para variables propias; no reescribir APIs externas ni borrar ejemplos históricos. Validar SQL, authz, cache y tests por impacto; clasificar `PASS/FAIL/NOT_RUN/BLOCKED`.

## Guías de librerías por versión — lectura antes de usar sus APIs

Las versiones de esta skill no se copian aquí: comprobar lockfile y [versión canónica](../.vigilio-docs/technology/versions.md). Cuando la tarea utilice una de estas dependencias, **abrir el `.md` completo** y consultar su migración ✅/❌ antes de escribir código; el resto no es obligatorio para una tarea que no la utiliza.
- [typescript](../.vigilio-docs/technology/catalog/typescript.md)
- [php](../.vigilio-docs/technology/catalog/php.md)
- [biome](../.vigilio-docs/technology/libraries/biome.md)
- [phpstan-larastan](../.vigilio-docs/technology/libraries/phpstan-larastan.md)

✅ Correcto: versionar el consumidor y seguir los ejemplos de la API instalada; enlazar documento propietario.  ❌ Incorrecto: copiar APIs legacy, duplicar normas en la skill o instalar nuevas dependencias sin gate.

## Gates de endpoints y comentarios — 2026-10-25

- Antes de crear/revisar rutas HTTP, leer [estándar REST multistack](../.vigilio-docs/standards/api/rest-endpoint-design.md): métodos, filtros, tenant/autorización, seguridad, idempotencia, concurrency, jobs, headers, error contract y pruebas; activar lo condicional solo si aplica.
- Antes de comentar código o aprobar docstrings, leer [estándar canónico de comentarios](../.vigilio-docs/standards/engineering/code-comments-and-docstrings.md): JSDoc/PHPDoc útiles, TODO/FIXME accionables, excepciones IC, no duplicar OpenAPI ni añadir comentarios triviales.
- Aplicar estas referencias al diff, preservar APIs/ejemplos existentes, ejecutar los quality gates disponibles y reportar `PASS`, `FAIL`, `NOT_RUN` o `BLOCKED` según evidencia real.

## Revisión automática de cualquier origen — Vigilio Auto-Senior

- Ejecutar revisión independiente incluso si el autor no utilizó skills. Inspeccionar diff, consumidores y contratos, sin editar en REVIEW.
- Fuente canónica: [análisis de impacto/gates](../.vigilio-docs/standards/engineering/change-impact-and-review-gates.md). Distinguir `PASS`, `FAIL`, `BLOCKED`, `NOT_RUN`; no afirmar que required checks están activos sin configuración de consumidor.

## Gate de relaciones polimórficas y trazabilidad

Si el diff afecta múltiples tipos de owner, `morphTo`, `target_type/target_id`, FK, tablas pivote o migraciones, leer la [norma canónica polimórfica](../.vigilio-docs/standards/data/polymorphic-relations.md) y verificar constraints reales, cross-tenant, borrado y consumidores. Para reglas de negocio o endpoints revisar [trazabilidad de caso de uso](../.vigilio-docs/standards/engineering/use-case-traceability.md). El resultado sigue siendo de **solo lectura** y distingue pruebas ejecutadas de `NOT_RUN`.


## Capacidades Rust/C++ y descubrimiento futuro — lectura condicionada

- [Descubrimiento agnóstico de tecnologías futuras](../.vigilio-docs/standards/ai/dynamic-capability-discovery.md): leer en tareas de arquitectura nueva, elección de stack, monorepos y selección automática de skills.
- [Rust Core](../.vigilio-docs/stacks/rust/README.md): cuando existe Cargo o se evalúa Rust; cargar GPUI/CLI/backend solo si el caso aplica.
- [C++ Core](../.vigilio-docs/stacks/cpp/README.md): cuando existen CMake/C++ o se evalúa C++; Qt y WebEngine son condicionales, no defaults.
- Inspeccionar archivos de los subproyectos `apps/`, `crates/`, `packages/`; reconocer `Cargo.toml`, `CMakeLists.txt`, targets y dependencias. En una idea sin código comparar alternativas y preguntar decisiones relevantes, no fingir que una tecnología está instalada.
- El catálogo de metadatos se construye desde las propias skills (`routing_*`); una futura skill de videojuegos puede descubrirse sin modificar reglas particulares del router. **No fingir** que propuestas son lecturas, implementaciones o pruebas.
- ✅ Correcto: evaluar tecnologías en paralelo solo en fase de decisión, seleccionar una tras evidencia y cargar la skill completa. ❌ Incorrecto: aplicar GPUI a C++ o Qt a Rust solo por mencionar desktop.

**Ownership por feature:** si esta tarea mueve constantes, tipos, Resources, componentes o utilidades, abrir [file-and-symbol-ownership](../.vigilio-docs/standards/engineering/file-and-symbol-ownership.md) y la guía específica del stack. No forzar carpetas globales por defecto.

