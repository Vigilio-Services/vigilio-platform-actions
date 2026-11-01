# Flujo De Contexto Eficiente

## Fuente Canónica

[Lee la guía completa de eficiencia](../../.vigilio-docs/platform-runtime/4-ai-context-efficiency.md).

## Herramientas

| Necesidad | Primera opción | Alternativa enfocada |
|---|---|---|
| Arquitectura | `get_architecture` | árbol limitado |
| Definición | `search_graph` | `rg` por símbolo |
| Impacto | `trace_path` | referencias del lenguaje |
| Implementación | `get_code_snippet` | rango exacto del archivo |
| Relaciones | `query_graph` | búsquedas sucesivas |
| Configuración | búsqueda textual | lectura del archivo concreto |
| Diff | diff limitado | archivos cambiados |
| Logs | errores únicos | salida completa guardada |

## Bien

```text
Consulta arquitectura.
Busca un símbolo.
Traza sus dependencias.
Lee solamente funciones afectadas.
Amplía al detectar incertidumbre.
```

## Mal

```text
Carga el repositorio completo.
Resume antes de identificar límites.
Ignora resultados truncados.
Concluye desde memoria desactualizada.
```

## Respuesta

### Bien

```text
Corregí el retry del worker.
La prueba duplicada ahora pasa.
Falta validar el replay productivo.
```

### Mal

```text
Después de una revisión bastante exhaustiva, considero que probablemente todo funciona correctamente.
```

## ✅ Correcto / ❌ Incorrecto: manejo de existente

- ✅ **Correcto:** Leer contexto real, seguir normas canónicas y documentar precondiciones, ejemplos, contraejemplos y verificación.
- ❌ **Incorrecto:** Copiar snippets sin imports, asumir versiones instaladas o declarar pruebas `PASS` sin ejecutarlas.
- **Gate:** no reescribir masivamente código heredado; inspeccionar baseline, tests y locks reales; reportar `NOT_RUN` si falta evidencia. La guía de refactor se consulta en `vigilio-docs/standards/engineering/refactoring-existing-code.md` según la revisión de Docs aprobada (no asumir que el link remoto `main` ya esté publicado).
