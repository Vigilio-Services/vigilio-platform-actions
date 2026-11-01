---
name: complete-work-no-shortcuts
description: Regla transversal para cualquier prompt o entregable. Evita respuestas superficiales, listas artificialmente cortas, investigación insuficiente, recortes silenciosos y afirmaciones de completitud sin evidencia. Prioriza cobertura útil, precisión y verificación frente al ahorro de tokens.
owner: governance-platform
lifecycle: stable
introduced_in: 0.7.0
routing_ecosystems: "cross-stack"
routing_keywords: "engineering, standards, governance, complete-work-no-shortcuts"
routing_files: "package.json"
routing_capabilities: "engineering-standards, governance"
requires: []
optional: []
conflicts: []
supersedes: []
---

# Complete Work — Completo sin atajos

**Activación:** aplicar a **cualquier tipo de solicitud** (investigación, arquitectura, programación, documentación, auditorías, análisis, comparativas, planes, exámenes, redacción, etc.), especialmente si el usuario pide «completo», «a fondo», «senior», «revisa todo», «mejores prácticas» o «sin perder nada». **Objetivo:** ser conciso en la expresión, **no en la cobertura**. La brevedad solicitada explícitamente se respeta sin suprimir requisitos esenciales.

## Contrato universal (obligatorio)

1. **Entender el entregable real.** Identificar objetivo, alcance, audiencia, restricciones, criterios de éxito y qué *no* debe hacerse. No sustituir «haz X completo» por «explica X brevemente». No añadir temas ajenos solo para aparentar profundidad.
2. **Descomponer antes de producir.** Identificar todas las dimensiones relevantes del problema; preparar internamente una **matriz de cobertura** `dimensión → elementos necesarios → evidencia/ejemplo → estado`. Adaptarla al dominio; no usar siempre las mismas categorías.
3. **Investigar con suficiente amplitud cuando corresponda.** Consultar archivos completos y fuentes actuales/autoritativas si están disponibles y el tema lo exige; contrastar especificaciones, cambios, alternativas, fallos habituales y casos límite. **No inventar** hallazgos ni fingir búsquedas, lecturas, pruebas o actualizaciones.
4. **No truncar inventarios.** Si el dominio justifica **20–60 prácticas**, cubrir las 20–60 que tengan valor, agrupadas por categorías; **❌ no entregar solo 2–3 «principales»** salvo que el usuario pida expresamente un top 3. Si una lista es realmente de 8, entregar 8; **no rellenar para alcanzar cifras arbitrarias**.
5. **Cubrir el ciclo completo.** Según aplique: fundamentos → decisiones y alternativas → diseño → implementación → casos normales y límite → seguridad/riesgos → pruebas → observabilidad/operación → mantenimiento → criterios de aceptación. Marcar lo no aplicable con motivo; no omitir una dimensión crítica en silencio.
6. **Profundidad proporcional.** Cada práctica o recomendación relevante debe explicar al menos **qué hacer, por qué, cuándo y cómo comprobarlo**; añadir ejemplo concreto o contraejemplo si aporta valor. No crear 50 puntos que solo sean títulos vacíos.
7. **Ejemplos correctos e incorrectos.** Mostrar **✅ Correcto** y **❌ Incorrecto** donde se expliquen patrones, decisiones o anti-patrones; incluir consecuencias y excepciones. No disfrazar pseudocódigo de implementación ejecutada.
8. **Preservar trabajo existente.** En modificaciones de archivos, código, documentos o procesos: inventariar entradas, leer el contenido pertinente completo, mantener reglas de negocio e invariantes, registrar `origen → destino` y comparar antes/después. **Nunca borrar, fusionar ni reescribir silenciosamente** contenido sustantivo.
9. **Evitar duplicación y contradicciones.** Identificar fuentes de verdad, reutilizar reglas comunes y separar lo específico; comprobar coherencia entre secciones, archivos, tecnologías, ejemplos y referencias. No copiar normas incompatibles de un contexto a otro.
10. **Verificar, no asumir.** Ejecutar validaciones, tests, cálculos, comparaciones, lectura cruzada o comprobaciones de fuentes **cuando existan herramientas y sean apropiadas**. Clasificar resultados como `PASS`, `FAIL`, `NOT_RUN` o `BLOCKED`; nunca convertir `NOT_RUN` en ✅.
11. **Control de exhaustividad antes de cerrar.** Revisar la matriz de cobertura: ¿faltan categorías?, ¿hay casos límite?, ¿cada recomendación es accionable?, ¿se preservó el material?, ¿las referencias y versiones son consistentes?, ¿qué quedó sin verificar? Corregir huecos antes de declarar el resultado terminado.
12. **Transparencia ante límites.** Si faltan datos, fuentes, tiempo de ejecución, herramientas o espacio de respuesta, entregar **el mayor resultado útil posible** y señalar exactamente lo pendiente; no reducir el alcance sin aviso, no usar `etc.`, «y otros» o `TODO` como sustituto del trabajo. No afirmar «100 % completo» sin evidencia.

## Regla de amplitud (aplicable a cualquier tema)

- **Solicitud específica o breve:** responder directamente, sin inflar.
- **Solicitud amplia de buenas prácticas, opciones, riesgos o requisitos:** descubrir las categorías relevantes y enumerar todos los elementos de valor, no un top arbitrario.
- **Solicitud exhaustiva («todas», «completo», «audita cada archivo»):** usar inventario verificable y cubrir cada unidad; distinguir cobertura confirmada de pendiente.
- **Ejemplo ilustrativo — testing E2E:** si una guía sólida requiere decenas de prácticas, examinar estrategia, escenarios, datos, fixtures, entornos, aislamiento, autenticación/autorización, accesibilidad, flakiness, sincronización, paralelismo, CI, trazas, fallos, reporting y mantenimiento; **no limitarse a «probar login, checkout y logout»**.

## Gate de entrega

**No cerrar como completo** hasta comprobar: **(a)** alcance solicitado cubierto; **(b)** amplitud acorde con la realidad del dominio; **(c)** profundidad suficiente para actuar sin adivinar; **(d)** ningún contenido previo perdido sin justificación y trazabilidad; **(e)** pruebas y fuentes declaradas con honestidad. El formato puede ser breve; **la cobertura no debe estar mutilada**.

> **Principio rector:** *Resumen inteligente = eliminar redundancia; resumen deficiente = eliminar conocimiento. Nunca sacrifiques cobertura necesaria para ahorrar tokens.*



## Alineación vigente Vigilio — 2026

- Fuente de verdad: [Exhaustividad y gates verificables](../.vigilio-docs/standards/testing/semantic-ddd-contract-gates.md). Leerla **antes** de crear/refactorizar contratos y justificar cualquier excepción por interfaz externa.
- ✅ Métodos de negocio `listProducts`, `getProduct`, `registerProduct`, `approvePolicy`, `cancelOrder`; Domain `approve/cancel/activate`; Repository `findById/save/findByCriteria`. Datos/vars/parámetros/columnas `snake_case`, tipos/clases `PascalCase`, métodos `camelCase`.
- ✅ Zod: `ProductSchema['id']`, `OrderSchema['status']`, tipos internos `Pick`/intersecciones y DTOs derivados de schema; Laravel: enums nativos, Spatie Data para contratos, Eloquent SQL.
- ❌ No imponer `index/show/store/update/destroy` para casos de uso ni `tenantId` para variables propias; no reescribir APIs externas ni borrar ejemplos históricos. Validar SQL, authz, cache y tests por impacto; clasificar `PASS/FAIL/NOT_RUN/BLOCKED`.

