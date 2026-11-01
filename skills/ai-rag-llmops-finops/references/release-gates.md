# AI/RAG: gates de release y fallos a evitar

| Gate | Evidencia | Bloqueo |
|---|---|---|
| Tenant + documento ACL | Prueba real usuario A/B mismo tenant y tenant diferente | NO-GO |
| Permisos de tools | Test de autorización server-side e idempotencia | NO-GO |
| LLM injection / poisoning | Dataset adversarial y análisis de fugas | NO-GO |
| Citas verificables | Citas resueltas contra chunks recuperados y versión | NO-GO |
| Embedding/pgvector | Dimensión real, digest, exacto vs HNSW, filtros y p95 | NO-GO si incompatible |
| Presupuesto | Reserva transaccional y prueba de doble solicitud simultánea | NO-GO si excede cuota |
| Telemetría | No se exportan prompts, documentos ni PII por defecto | NO-GO si hay exposición |
| Producción | Restore, rollback, SLO, costos, SQL sin privilegios | NO-GO si falta gate crítico |

❌ Declarar que `schema-rag.sql` cubre ACL por documento. Solo incluye RLS a nivel tenant y HNSW como ejemplo opcional.

❌ Declarar que seis casos JSONL son regresión aprobada, o que `politica-ejemplo.yaml` hace hard-stop automáticamente.

✅ Registrar excepciones aprobadas, riesgos residuales, owners y `NOT_RUN` sin inventar pruebas.
