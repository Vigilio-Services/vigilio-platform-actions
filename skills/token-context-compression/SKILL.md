---
name: token-context-compression
description: Comprime codigo, logs y texto antes de procesarlos para reducir ruido de contexto. Usar con outputs extensos de CI, CloudWatch, Lambda o archivos grandes; conservar siempre una copia original.
---

<skill-content>

# TokenShrink — Limpieza de Contexto

Antes de analizar archivos grandes (logs, output de herramientas, codigo extenso), usa el script `scripts/compress.ts` de este skill para limpiar el texto.

## Cuando Usarlo

- Cuando un archivo tiene mas de 200 lineas
- Cuando recibes output de AWS CloudWatch o Lambda
- Cuando necesitas analizar logs de CI/CD
- Cuando un archivo tiene muchos comentarios irrelevantes

## Como Usarlo

Ejecuta el script `scripts/compress.ts` con el archivo como argumento:

```bash
npx tsx .opencode/skills/token-context-compression/scripts/compress.ts <ruta-del-archivo>
```

El script imprime el contenido comprimido a stdout. Usalo para reducir el contexto antes de procesar.

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
