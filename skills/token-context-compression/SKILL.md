---
name: token-context-compression
description: Comprime logs repetitivos y texto exploratorio para reducir ruido. Usar con CI, CloudWatch o Lambda; nunca usar contenido comprimido como única evidencia de contratos, seguridad o revisiones sensibles.
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

</skill-content>
