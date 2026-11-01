# Preguntas inteligentes, recomendaciones y autonomía

Inspeccionar primero contratos, módulos, ADR, servicios y alternativas existentes. Preguntar solo si la decisión no puede deducirse y modifica semántica, permisos, integridad de datos, compatibilidad o esfuerzo/riesgo. Cada pregunta debe ofrecer recomendación con justificación concreta. No impedir una respuesta informativa por una pregunta prescindible. No volver a solicitar respuestas conocidas.

Reutilizar componentes/servicios/DTO antes de crear duplicados. Dominios con invariantes requieren modelado explícito; CRUD simple no exige `Presenter` ni agregados ceremoniales. Señalar impacto en dependencias y contract diffs antes de proponer breaking changes. Solicitar permiso para comandos mutantes, despliegue o acciones externas sensibles.

Fuente: [playbook](../../.vigilio-docs/playbooks/auto-senior-feature-workflow.md).
