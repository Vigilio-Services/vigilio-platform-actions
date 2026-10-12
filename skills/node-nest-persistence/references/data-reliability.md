# Datos Y Confiabilidad Node/Nest

## Fuentes Canonicas

- [Calidad backend de datos y SQL](https://github.com/VigilioYonatan/vigilio-docs/blob/main/software-factory/backend-data-sql.md): baseline transversal.
- [Cache](https://github.com/VigilioYonatan/vigilio-docs/blob/main/backend-node-nest/9-cache.md): TTL, invalidacion y stampede.
- [Gobierno de datos](https://github.com/VigilioYonatan/vigilio-docs/blob/main/backend-node-nest/13-data-governance.md): PII, tenant, retencion y decimales.
- [Resiliencia y eventos](https://github.com/VigilioYonatan/vigilio-docs/blob/main/backend-node-nest/14-resilience-events.md): outbox, inbox, idempotencia y DLQ.
- [Migraciones](https://github.com/VigilioYonatan/vigilio-docs/blob/main/backend-node-nest/15-migrations-db.md): PostgreSQL/Drizzle, backfill y recovery.
- [Seeders](https://github.com/VigilioYonatan/vigilio-docs/blob/main/backend-node-nest/26-seeders-ddd.md): seeders idempotentes.
- `src/**/infrastructure/persistence/drizzle/**`, migrations y tests de integracion: evidencia ejecutable.

Las reglas detalladas viven en `vigilio-docs`; esta referencia no mantiene otra copia. Confirmar
invariantes, compatibilidad, concurrencia, cache y recovery contra el codigo y las versiones reales.

