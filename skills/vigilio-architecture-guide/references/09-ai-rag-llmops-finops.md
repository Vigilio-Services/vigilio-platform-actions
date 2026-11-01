# 09 — IA/RAG/LLMOps/FinOps en Vigilio

**Skill específica:** `ai-rag-llmops-finops` mediante perfil `ai-rag`; es independiente de `core` y `core-cross-stack` y se combina con el stack real.

## Documentos propietarios

- Fundamentos: `foundations/ai/decisiones-rag-agentes.md`.
- Estándares: `standards/ai/` para seguridad, embeddings, retrieval, evaluación, observabilidad y FinOps.
- Plataforma: `platform/ai/` para esquemas SQL, métricas y política de presupuesto (ejemplos sin enforcement).
- Stacks: `stacks/backend/{nestjs,laravel}/ai-rag-architecture.md` como adaptadores, sin duplicar DDD/SOLID.
- Playbooks: `playbooks/ai-rag/` para evaluación, CI, incidentes y Go/No-Go.
- Versiones: `technology/baselines/ai-rag-stack-economico.md` propuesto, sin promover dependencias sin compatibilidad probada.

## Enrutamiento

```bash
pnpm exec vigilio-skills sync --profile core-cross-stack --profile php-laravel --profile ai-rag --profile openspec
pnpm exec vigilio-skills sync --profile core --profile node-nest --profile ai-rag --profile openspec
```

Ningún perfil instala modelos, monta PostgreSQL ni crea presupuestos: sincroniza documentación y skills. Por seguridad, no declarar `PASS` si faltan SQL/ACL de documentos, model/runtime, evals o presupuesto atómico.

> Fuente única para **Navegación canónica multistack 2026**: [abrir documento canónico](../../.vigilio-docs/stacks/backend/nestjs/README.md).

## Hybrid RAG 2026 — lectura obligatoria por tarea

- [Selección SQL / Hybrid / Agentic / Graph / multimodal](../../.vigilio-docs/foundations/ai/seleccion-arquitectura-2026.md)
- [Hybrid RAG PostgreSQL: FTS, pgvector, RRF, ACL](../../.vigilio-docs/standards/ai/hybrid-rag-postgresql.md)
- [Reranking: beneficios y gates](../../.vigilio-docs/standards/ai/reranking.md)
- [Modelo, dimensiones, índices y rollback](../../.vigilio-docs/standards/ai/model-lifecycle.md)
- [Evals de recuperación y generación](../../.vigilio-docs/standards/ai/evaluacion-calidad.md)
- [Qwen3 Embedding](../../.vigilio-docs/technology/libraries/qwen3-embedding.md), [Qwen3 Reranker](../../.vigilio-docs/technology/libraries/qwen3-reranker.md), [Ragas](../../.vigilio-docs/technology/libraries/ragas.md), [LangGraph](../../.vigilio-docs/technology/libraries/langgraph.md)

✅ **Correcto:** leer solo dependencias pertinentes y aplicar permisos por documento antes de recuperar texto. ❌ **Incorrecto:** copiar SQL sin ACL de usuario, atribuir `/api/rerank` universal a Ollama o declarar runtime validado por leer MD.
