---
name: ai-rag-llmops-finops
description: Diseñar, auditar y mejorar RAG seguro multi-tenant, retrieval pgvector, embeddings, evaluación, tracing GenAI, límites de costos/FinOps y agentes/tools en NestJS o Laravel siguiendo el snapshot canónico Vigilio. Activar para ingesta, búsqueda híbrida, ACL, pipelines LLM, incidentes IA, presupuestos y gates de producción.
owner: governance-platform
lifecycle: stable
introduced_in: 0.7.0
routing_ecosystems: "cross-stack"
routing_keywords: "engineering, standards, governance, ai-rag-llmops-finops"
routing_files: "package.json"
routing_capabilities: "engineering-standards, governance"
requires: []
optional: []
conflicts: []
supersedes: []
---

# AI/RAG + LLMOps + FinOps — Skill operativa Vigilio

**Orientación, no proyecto ejecutable.** No declarar que el ejemplo SQL proporciona ACL a nivel documento, que los presupuestos YAML se aplican solos o que el dataset JSONL equivale a pruebas superadas.

## 1. Contexto y seguridad obligatorios

1. Leer `AGENTS.md` y reglas humanas del consumidor; detectar runtime real, lockfiles, migraciones, autenticación, políticas de datos, SLO y arquitectura actual. Respetar ADR y decisiones aprobadas.
2. Consultar [decisiones IA](../.vigilio-docs/foundations/ai/decisiones-rag-agentes.md), [seguridad IA](../.vigilio-docs/standards/ai/seguridad-ia.md) y [guía operativa](references/canonical-workflow.md).
3. Elegir **RAG** solo para preguntas sobre conocimiento documental autorizado; emplear APIs/tools con permisos para estados transaccionales actuales; multiagente únicamente si las evaluaciones justifican complejidad.
4. Si hay documentos privados, **bloquear** despliegue sin pruebas de tenant + usuario + documento, pools SQL, cache ACL, prompt injection y borrado. Separar texto recuperado (datos no fiables) de instrucciones confiables.

## 2. Ingeniería por tarea (leer docs selectivamente)

| Tarea | Fuente canónica |
|---|---|
| Ingesta, chunks, embeddings | [ingesta](../.vigilio-docs/standards/ai/embeddings-ingesta.md) |
| pgvector, HNSW, RLS (ACL **incompleto**) | [pgvector](../.vigilio-docs/standards/ai/pgvector-postgresql.md) |
| Retrieval, citas, abstención | [RAG](../.vigilio-docs/standards/ai/rag-recuperacion.md) |
| Calidad, datasets, CI | [Evals](../.vigilio-docs/standards/ai/evaluacion-calidad.md), [release](../.vigilio-docs/playbooks/ai-rag/go-no-go.md) |
| Logs, OpenTelemetry, trazas LLM | [Observabilidad](../.vigilio-docs/standards/ai/observabilidad-llm.md) |
| Contabilidad de tokens, cuotas | [FinOps](../.vigilio-docs/standards/ai/finops-llm.md) |
| Agentes, tools y aprobación | [Tools](../.vigilio-docs/standards/ai/agentes-tools.md) |
| NestJS/Zod | [adaptador NestJS](../.vigilio-docs/stacks/backend/nestjs/ai-rag-architecture.md) |
| Laravel/PHP | [adaptador Laravel](../.vigilio-docs/stacks/backend/laravel/ai-rag-architecture.md) |

## 3. Diseño DDD pragmático, no ceremonial

- Controllers delgados `answerQuestion()`, `ingestDocument()`, `searchKnowledge()`; handlers/use cases semánticos; domain policies/invariantes; `EmbeddingProvider`, `KnowledgeRetriever`, `AnswerGenerator`, `DocumentRepository`, `BudgetAuthorizer` como ports solo cuando aporten valor.
- NestJS: requests Zod validados, schemas compartidos con `.pick()` y `z.infer`, OpenAPI/Scalar; responses tipadas sin `.parse()` extra por defecto; nunca confiar `tenant_id` del body.
- Laravel: Form Requests/Policies, DTO tipados, Resources y OpenAPI interoperable; Eloquent en infraestructura, no en Domain. Respetar separación `constants/`, `types/`, `enums/` útil por capa.
- Ingesta asíncrona e idempotente; comparar búsqueda exacta vs HNSW; índices, dimensiones, normalización e instrucciones de embedding versionados.

## 4. Regla de calidad y costos

- Dataset con fixtures autorizados y casos de abstención, inyección y fugas. Medir Recall@K, MRR/nDCG, faithfulness, citas resolubles, p95, costo por respuesta útil y errores.
- Presupuesto por tenant **reservado atómicamente** antes de llamar al proveedor, con reintentos acotados y conciliación de facturación. Regla presupuestaria YAML **no instala enforcement**.
- OTel sin prompts/PII por defecto; labels Prometheus de baja cardinalidad. No inventar `PASS`, tarifas actuales, modelo instalado ni versión de pgvector.

## 5. Prohibiciones y release

❌ SQL de RAG con rol privilegiado; RLS solo por tenant como autorización final; confiar en prompt contra prompt injection; citar documentos inventados; reutilizar caché sin ACL; hacer `forEach(async ...)` sin esperar; `DEL('prefix:*')` como invalidación; HNSW y GPU por inercia; payloads privados en logs.

✅ Conservar contenido canónico, ejecutar `validate-docs`, `check:docs`, pruebas SQL bajo rol real, cross-user/cross-tenant, presupuesto concurrente, tests de citas y contratos, evaluaciones con fixtures. Reportar `NOT_RUN` y **NO-GO** si falta evidencia crítica. Consultar [gates](references/release-gates.md).

## Lectura obligatoria de referencias

- [Flujo de implementación](references/canonical-workflow.md)
- [Release y seguridad](references/release-gates.md)
- [Tecnología baseline propuesto](../.vigilio-docs/technology/baselines/ai-rag-stack-economico.md)

## Evaluación completa y segura

Seleccionar desde la [matriz RAG de 32 controles](../.vigilio-docs/standards/ai/matriz-calidad-rag.md) todos los aplicables: retrieval, ACL, groundedness, seguridad, latencia, costes y regresión. ✅ Evidencia con dataset reproducible; ❌ declarar RAG listo por tres preguntas satisfactorias.

## Guías de librerías por versión — lectura antes de usar sus APIs

Las versiones de esta skill no se copian aquí: comprobar lockfile y [versión canónica](../.vigilio-docs/technology/versions.md). Cuando la tarea utilice una de estas dependencias, **abrir el `.md` completo** y consultar su migración ✅/❌ antes de escribir código; el resto no es obligatorio para una tarea que no la utiliza.
- [pgvector](../.vigilio-docs/technology/libraries/pgvector.md)
- [postgresql](../.vigilio-docs/technology/libraries/postgresql.md)
- [ollama](../.vigilio-docs/technology/libraries/ollama.md)
- [langfuse](../.vigilio-docs/technology/libraries/langfuse.md)
- [arize-phoenix](../.vigilio-docs/technology/libraries/arize-phoenix.md)

✅ Correcto: versionar el consumidor y seguir los ejemplos de la API instalada; enlazar documento propietario.  ❌ Incorrecto: copiar APIs legacy, duplicar normas en la skill o instalar nuevas dependencias sin gate.

## Hybrid RAG 2026 — lectura obligatoria por tarea

- [Selección SQL / Hybrid / Agentic / Graph / multimodal](../.vigilio-docs/foundations/ai/seleccion-arquitectura-2026.md)
- [Hybrid RAG PostgreSQL: FTS, pgvector, RRF, ACL](../.vigilio-docs/standards/ai/hybrid-rag-postgresql.md)
- [Reranking: beneficios y gates](../.vigilio-docs/standards/ai/reranking.md)
- [Modelo, dimensiones, índices y rollback](../.vigilio-docs/standards/ai/model-lifecycle.md)
- [Evals de recuperación y generación](../.vigilio-docs/standards/ai/evaluacion-calidad.md)
- [Qwen3 Embedding](../.vigilio-docs/technology/libraries/qwen3-embedding.md), [Qwen3 Reranker](../.vigilio-docs/technology/libraries/qwen3-reranker.md), [Ragas](../.vigilio-docs/technology/libraries/ragas.md), [LangGraph](../.vigilio-docs/technology/libraries/langgraph.md)

✅ **Correcto:** leer solo dependencias pertinentes y aplicar permisos por documento antes de recuperar texto. ❌ **Incorrecto:** copiar SQL sin ACL de usuario, atribuir `/api/rerank` universal a Ollama o declarar runtime validado por leer MD.

