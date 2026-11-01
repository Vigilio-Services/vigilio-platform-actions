---
name: token-context-compression
description: Comprime logs repetitivos y texto exploratorio para reducir ruido. Usar con CI, CloudWatch o Lambda; nunca usar contenido comprimido como única evidencia de contratos, seguridad o revisiones sensibles.
owner: governance-platform
lifecycle: stable
introduced_in: 0.7.0
routing_ecosystems: "cross-stack"
routing_keywords: "engineering, standards, governance, token-context-compression"
routing_files: "package.json"
routing_capabilities: "engineering-standards, governance"
requires: []
optional: []
conflicts: []
supersedes: []
---

<skill-content>

# TokenShrink — Limpieza de Contexto

Usa primero `codebase-context-efficiency` para limitar el alcance.

Usa este compresor solamente sobre una copia.

Conserva siempre el contenido original.

## Cuando Usarlo

- Cuando recibes output de AWS CloudWatch o Lambda
- Cuando necesitas analizar logs de CI/CD
- Cuando el output contiene líneas repetidas

## Como Usarlo

Ejecuta el script `scripts/compress.ts` con el archivo como argumento:

```bash
npx tsx .opencode/skills/token-context-compression/scripts/compress.ts <ruta-del-archivo>
```

El script imprime el contenido comprimido a stdout. Usalo para reducir el contexto antes de procesar.

Compara cualquier hallazgo con el contenido original.

No comprimas schemas, migraciones, policies, contratos o errores únicos.

## Que Elimina

- Lineas vacias consecutivas (3+ → 1)
- Comentarios de linea (`// ...`)
- Comentarios de bloque (`/* ... */`)
- `console.log/debug/info/warn`
- Imports de type vacios
- Espacios multiples excesivos
- NestJS decoradores metadata pura (`@Module({...})` → `@Module({...})`)
- Timestamps de CloudWatch
- Request IDs de Lambda
- Lineas START/END/REPORT de Lambda


> Fuente única para **Correcto / Incorrecto: manejo de existente**: [abrir documento canónico](../.vigilio-docs/standards/engineering/refactoring-existing-code.md).

## ✅ Correcto / ❌ Incorrecto — tarea `token-context-compression`

✅ **Correcto:** en esta tarea, aplicar criterios verificables específicos de esta guía y consultar su owner canónico; remitir la norma compartida al documento propietario.

❌ **Incorrecto:** en esta tarea, copiar reglas de otro stack o declarar evidencia sin haberla ejecutado; inventar pruebas o pegar el mismo procedimiento transversal en varias skills.

