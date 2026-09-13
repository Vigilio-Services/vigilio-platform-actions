---
name: codebase-context-efficiency
description: Reduce tokens while preserving evidence and answer quality. Use for code discovery, reviews, debugging, large repositories, logs, CI outputs and cross-repository analysis with Codebase Memory MCP or focused fallbacks.
---

<skill-content>

# Contexto Eficiente

## Lectura obligatoria de referencias

Lee completamente [references/context-workflow.md](references/context-workflow.md).

Abre cada fuente canónica aplicable.

No cierres gates cuando una fuente requerida resulte inaccesible.

## Orden De Herramientas

1. Lee instrucciones y alcance.
2. Usa `get_architecture` para comprender límites.
3. Usa `search_graph` para encontrar símbolos.
4. Usa `trace_path` para medir impacto.
5. Usa `get_code_snippet` para leer implementación.
6. Usa `query_graph` para relaciones complejas.
7. Usa búsqueda textual para configs y literales.
8. Lee archivos completos solamente cuando resulte necesario.

Usa alternativas disponibles cuando el grafo falte.

No instales herramientas sin autorización.

## Calidad

- Detecta resultados truncados.
- Pagina antes de concluir cobertura.
- Conserva errores, contratos y decisiones exactas.
- Revalida memoria contra código cambiante.
- Ejecuta pruebas dirigidas antes de suites completas.
- Amplía alcance cuando la evidencia resulte insuficiente.

## Respuesta

- Resume primero el resultado.
- Usa frases de máximo quince palabras.
- Expresa una idea por oración.
- Usa verbos directos.
- Mantén un término por concepto.
- Elimina adjetivos y conectores innecesarios.
- Conserva ejemplos que permitan ejecutar o verificar.
- Añade detalles cuando cambien una decisión.

</skill-content>
