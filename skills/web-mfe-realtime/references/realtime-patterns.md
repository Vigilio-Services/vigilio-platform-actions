# Patrones De Tiempo Real Frontend

## Fuentes Canónicas

| Necesidad | Fuente |
|---|---|
| Realtime frontend | [vigilio-docs/19-realtime](https://github.com/VigilioYonatan/vigilio-docs/blob/main/frontend-web-mfe/19-realtime-websocket-sse.md) |
| Contrato backend | [vigilio-docs/44-realtime](https://github.com/VigilioYonatan/vigilio-docs/blob/main/backend-node-nest/44-realtime-websocket-sse.md) |
| Estado frontend | [vigilio-docs/3-architecture](https://github.com/VigilioYonatan/vigilio-docs/blob/main/frontend-web-mfe/3-arquitectura-estructura-estado.md) |
| Accesibilidad | [vigilio-docs/8-quality](https://github.com/VigilioYonatan/vigilio-docs/blob/main/frontend-web-mfe/8-calidad-seo-accesibilidad-rendimiento.md) |

Lee completamente cada fuente aplicable.

## Decisión Rápida

| Caso | Bien | Mal |
|---|---|---|
| Cotización cambiante | SSE | socket bidireccional innecesario |
| Chat | Socket.IO | polling continuo |
| Datos iniciales | HTTP + Query | esperar primer evento |
| Evento confirmado | invalidar cache | duplicar cache global |
| Desmontaje | cerrar listener | acumular callbacks |

## Evidencia

- Existe una conexión controlada.
- Cleanup evita listeners duplicados.
- Backoff tiene límite y jitter.
- El modo degradado mantiene navegación.
- Las actualizaciones relevantes resultan accesibles.
