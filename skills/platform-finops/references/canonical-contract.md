# Contrato Canónico De Inteligencia De Costos Cloud Y FinOps

## Fuentes Canónicas

| Necesidad | Fuente |
|---|---|
| Reglas operativas compartidas | [contrato común](../../.vigilio-docs/standards/platform/common-operational-contract.md) |
| Contrato canónico | [vigilio-docs/finops-intelligence](../../.vigilio-docs/platform/finops/cloud-cost-intelligence.md) |
| Evidencia operacional | [vigilio-docs/evidence](../../.vigilio-docs/platform/sre/operational-evidence.md) |

Lee completamente cada fuente aplicable.

## Evidencia Específica

- Fuente de coste reconciliada con factura o ledger del proveedor.
- Asignación por equipo, entorno, servicio y unidad de negocio.
- Presupuesto, anomalías y coste unitario con ventana definida.
- Ahorro propuesto comparado con impacto en SLO y capacidad.

## Excepciones Específicas

Una estimación local debe etiquetarse como estimación y no como factura. Recursos sin owner o dimensión de coste bloquean la declaración de coste unitario confiable.

## ✅ Correcto / ❌ Incorrecto: manejo de existente

- ✅ **Correcto:** Monitorear costos en tiempo real con OpenCost, migrar a Graviton y rechazar recursos no etiquetados.
- ❌ **Incorrecto:** Operar infraestructura cloud sin visibilidad granular de gasto por equipo ni alertas de anomalías financieras.
