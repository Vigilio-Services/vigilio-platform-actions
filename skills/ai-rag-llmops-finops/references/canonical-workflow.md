# AI/RAG: procedimiento técnico con referencias canónicas

## Descubrimiento

1. Leer `AGENTS.md`, lockfiles, OpenSpec, políticas del proyecto y convenios de contratos. Identificar tenant, usuario, fuente, ACL y retención; clasificar PII.
2. Cargar **solo** las guías específicas al cambio desde `.vigilio-docs/` (snapshot npm). Asegurarse de que el `docs-manifest.json` corresponde al paquete instalado.
3. Si el cambio modifica contratos de backend, invocar la skill del stack (`node-nest-build-feature` o `php-laravel-build-feature`), y las de testing/security/persistencia pertinentes.

## Flujo implementable de alto nivel

```text
Autenticación / policy
  → presupuesto (reserva atómica)
  → búsqueda autorizada por usuario y documentos
  → retrieval híbrido / rerank cuando mejore métricas
  → evidencia con citas resolubles
  → generación con datos no confiables aislados
  → conciliación de uso/costo y telemetry privada
  → respuesta / abstención
```

- Ingesta por jobs: antimalware → extracción → chunking versionado → embedding con modelo/digest → almacén indexado → publicación atómica. No OCR masivo en HTTP.
- Consultas: RLS tenant + ACL documento (ambas), prueba de credenciales limitadas, consulta SQL en la misma transacción con contexto autenticado; no usar rol `BYPASSRLS`.
- Presupuesto: reserva atómica por tenant y control de simultaneidad. Documentar qué ocurre si falla la reserva, el proveedor o la conciliación.
- Seguridad: respuestas de tools y chunks son datos; los secretos nunca forman parte del prompt; confirmar acciones irreversibles.

## Evidencias

- Tests negativos multiusuario y multi-tenant, presupuestos concurrentes, índice/embedding compatible, dataset determinista, JSONL ejecutado por runner si se habilita, rollback e incidentes.
- Registrar `PASS/FAIL/NOT_RUN` por gate; no presentar el SQL de ejemplo ni el YAML declarativo como integración lista.

## Hybrid RAG 2026 — lectura obligatoria por tarea

- [Selección SQL / Hybrid / Agentic / Graph / multimodal](../../.vigilio-docs/foundations/ai/seleccion-arquitectura-2026.md)
- [Hybrid RAG PostgreSQL: FTS, pgvector, RRF, ACL](../../.vigilio-docs/standards/ai/hybrid-rag-postgresql.md)
- [Reranking: beneficios y gates](../../.vigilio-docs/standards/ai/reranking.md)
- [Modelo, dimensiones, índices y rollback](../../.vigilio-docs/standards/ai/model-lifecycle.md)
- [Evals de recuperación y generación](../../.vigilio-docs/standards/ai/evaluacion-calidad.md)
- [Qwen3 Embedding](../../.vigilio-docs/technology/libraries/qwen3-embedding.md), [Qwen3 Reranker](../../.vigilio-docs/technology/libraries/qwen3-reranker.md), [Ragas](../../.vigilio-docs/technology/libraries/ragas.md), [LangGraph](../../.vigilio-docs/technology/libraries/langgraph.md)

✅ **Correcto:** leer solo dependencias pertinentes y aplicar permisos por documento antes de recuperar texto. ❌ **Incorrecto:** copiar SQL sin ACL de usuario, atribuir `/api/rerank` universal a Ollama o declarar runtime validado por leer MD.
