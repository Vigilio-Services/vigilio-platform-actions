---
name: review-code-change
description: Revisa diffs, pull requests o implementaciones terminadas con evidencia y severidad, alineando codigo, contratos y gates con docs/rules y OpenSpec. Usar solo cuando se solicite code review, revision de PR, readiness para merge o la fase REVIEW; no usar para implementar o corregir cambios.
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

Antes de emitir hallazgos de calidad, leer y aplicar
[references/peer-quality-checklist.md](references/peer-quality-checklist.md). Sus reglas son criterios de
riesgo y mantenibilidad; las convenciones ejecutables del repositorio siguen teniendo precedencia.

Antes de responder, leer y usar [references/review-format.md](references/review-format.md). Ordenar los
hallazgos por severidad y luego por archivo/línea. Si no hay hallazgos, decirlo explícitamente y
mantener una sección breve de riesgos residuales o evidencia no disponible.
