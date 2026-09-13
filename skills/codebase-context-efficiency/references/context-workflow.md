# Flujo De Contexto Eficiente

## Fuente Canónica

[Lee la guía completa de eficiencia](https://github.com/VigilioYonatan/vigilio-docs/blob/main/platform-runtime/4-ai-context-efficiency.md).

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
