---
name: codebase-context-efficiency
description: Reduce tokens while preserving evidence and answer quality. Use for code discovery, reviews, debugging, large repositories, logs, CI outputs and cross-repository analysis with Codebase Memory MCP or focused fallbacks.
owner: governance-platform
lifecycle: stable
introduced_in: 0.7.0
routing_ecosystems: "cross-stack"
routing_keywords: "engineering, standards, governance, codebase-context-efficiency"
routing_files: "package.json"
routing_capabilities: "engineering-standards, governance"
requires: []
optional: []
conflicts: []
supersedes: []
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


## ✅ Correcto / ❌ Incorrecto: manejo de existente

- ✅ **Correcto:** Leer contexto real, seguir normas canónicas y documentar precondiciones, ejemplos, contraejemplos y verificación.
- ❌ **Incorrecto:** Copiar snippets sin imports, asumir versiones instaladas o declarar pruebas `PASS` sin ejecutarlas.
- **Gate:** no reescribir masivamente código heredado; inspeccionar baseline, tests y locks reales; reportar `NOT_RUN` si falta evidencia. La guía de refactor se consulta en `vigilio-docs/standards/engineering/refactoring-existing-code.md` según la revisión de Docs aprobada (no asumir que el link remoto `main` ya esté publicado).

</skill-content>

