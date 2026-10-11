# Checklist Senior De Calidad Y Comentarios

Usar solo los criterios aplicables al diff. La configuración ejecutable, `AGENTS.md`, formatter, linter,
contratos y patrones repetidos del repositorio tienen precedencia sobre preferencias genéricas.

## Diseño Y Legibilidad

- Los nombres expresan responsabilidad y contenido; no reutilizan el mismo término para conceptos
  diferentes.
- Cada función conserva una responsabilidad cohesiva y un nivel de abstracción. Extraer cuando la
  complejidad, ramificación o mezcla de I/O y dominio dificulte verificarla.
- No imponer máximos universales de líneas, columnas o tres parámetros. Usar formatter y reglas reales;
  agrupar parámetros cuando formen un concepto estable, no para esconder una firma confusa.
- No dejar imports, variables, parámetros, ramas, código inalcanzable o bloques comentados sin uso.
- Mantener formato e indentación mediante la herramienta del repositorio; no imponer tabs o espacios a
  mano.
- Para unions discriminadas o enums cerrados, preferir exhaustividad verificable. Un `default` genérico
  puede ocultar casos nuevos; exigirlo solo cuando la semántica lo necesite.

## Configuración Y Hardcode

- No incrustar IPs, URLs de ambiente, credenciales, IDs operativos ni valores de base de datos dentro de
  lógica de negocio. Resolverlos desde configuración validada o autoridad canónica.
- Constantes de dominio estables sí pueden vivir en código cuando tienen owner, nombre y pruebas; no
  confundir una invariante con configuración desplegable.
- No copiar el mismo literal entre contrato, implementación y tests para fabricar coincidencia. Usar el
  owner contractual o builders que sigan ejercitando el comportamiento real.

## Comentarios Y Documentación En Código

Agregar comentarios cuando expliquen algo que el código no puede expresar bien por sí solo:

- por qué existe una decisión o workaround;
- invariante, precondición o restricción no obvia;
- semántica de seguridad, concurrencia, idempotencia o compatibilidad;
- riesgo de migración/rollback o comportamiento de una integración externa;
- contrato público cuando la herramienta genera OpenAPI/TypeDoc desde esa documentación.

El comentario debe ser breve, actualizado y estar junto a la decisión. Referenciar ADR, issue o contrato
cuando aporte contexto durable.

No agregar:

- nombre del autor, fecha o historial manual de modificaciones: Git ya es la autoridad;
- comentarios que repiten literalmente la instrucción siguiente;
- código muerto comentado;
- secretos, payloads reales o PII;
- `TODO` sin razón accionable; si necesita seguimiento, incluir owner o ticket según la convención real.

### Ejemplos De Comentarios Senior

Bien — explica decisión, invariante y referencia durable sin repetir el código:

```ts
// El proveedor puede reenviar el mismo evento. La clave externa evita duplicar el abono.
// Ver ADR-014 para la ventana de retención y la estrategia de replay.
await ledger.applyOnce(event.externalId, event.amount);
```

```ts
/**
 * Mantiene el importe como decimal textual para no perder precisión entre JSON y la base de datos.
 * Precondición: el valor ya fue validado por el schema de entrada.
 */
function toSettlementAmount(value: string): SettlementAmount {
  return SettlementAmount.fromDecimal(value);
}
```

Mal — repite la instrucción, agrega historial manual o deja una deuda sin owner:

```ts
// Incrementa el contador.
attempts += 1;

// Juan Perez - 11/10/2026 - se cambió este método.
// TODO: arreglar luego.
```

Para APIs públicas, documentar semántica, restricciones, seguridad y errores en el contrato ejecutable;
no trasladar una especificación completa a comentarios del controller. Para migraciones, documentar
forward, verificación y recovery en su owner operativo, no como un bloque histórico pegado al SQL.

## Excepciones Y Flujo

- Nunca dejar `catch` vacío ni suprimir silenciosamente un fallo.
- Capturar solo para recuperar, traducir a una frontera pública, compensar, enriquecer con contexto seguro
  o liberar recursos. Evitar `try/catch` ceremonial que solo hace `throw error`.
- Preservar causa y errores tipados; no convertir todos los fallos en un mismo `500` sin trazabilidad.
- No ejecutar lógica después de `return`/`throw` ni modificar de forma sorpresiva el contador de un loop.
- Validar inputs en la frontera de confianza y no asumir que TypeScript valida datos runtime.

## Revisión Basada En Evidencia

- Reportar complejidad, SQL lento, falta de índice o riesgo de producción solo con una cadena causal y
  evidencia suficiente.
- Una desviación puramente estética cubierta por formatter/linter no es hallazgo manual.
- Consolidar repeticiones con la misma causa raíz.
- Proponer el arreglo mínimo compatible con SOLID/DRY y con la lógica de negocio existente.

## Reglas Históricas Que No Se Importan Como Dogma

- límites rígidos de 100 líneas, 120 columnas o tres parámetros;
- `try/catch` en todos los métodos;
- `default` obligatorio en todo `switch`;
- dogmas de rendimiento SQL sin semántica ni plan; el criterio detallado pertenece a la referencia
  `data-sql.md` de `backend-engineering-quality`;
- cabeceras de autor/fecha/ticket dentro de cada fragmento;
- porcentajes de cobertura o listas fijas de status HTTP sin autoridad del proyecto.

Aplicar la intención útil detrás de esas reglas —legibilidad, trazabilidad, rendimiento y calidad— con
evidencia y sin contradecir el stack actual.
