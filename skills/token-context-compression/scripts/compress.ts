#!/usr/bin/env npx tsx
/**
 * TokenShrink context compression script.
 *
 * Usage: pnpm exec tsx .opencode/skills/token-context-compression/scripts/compress.ts <file>
 * Output: Compressed content to stdout
 */
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const filePath = process.argv[2];
if (!filePath) {
  console.error('Usage: npx tsx compress.ts <file>');
  process.exit(1);
}

const raw = readFileSync(resolve(filePath), 'utf-8');

const compressed = raw
  // Eliminar líneas vacías consecutivas
  .replace(/(\r?\n){3,}/g, '\n\n')
  // Eliminar comentarios de línea
  .replace(/^\s*\/\/.*$/gm, '')
  // Eliminar comentarios de bloque
  .replace(/\/\*[\s\S]*?\*\//g, '')
  // Eliminar console.log/debug/info/warn
  .replace(/console\.(log|debug|info|warn)\([\s\S]*?\);?\s*/g, '')
  // Eliminar imports de type vacíos
  .replace(/^import\s+type\s*\{\s*\}\s+from\s+['"].*?['"];?\s*$/gm, '')
  // Comprimir espacios múltiples
  .replace(/[^\S\r\n]{4,}/g, '  ')
  // Comprimir NestJS decoradores metadata
  .replace(/@(Module|Injectable|Controller)\(\{[\s\S]*?\}\)/g, (match) => {
    const name = match.match(/@(\w+)/)?.[1] ?? 'Unknown';
    return `@${name}({...})`;
  })
  // CloudWatch timestamps
  .replace(/\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z\s*/g, '')
  // Lambda request IDs
  .replace(/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/g, '[REQ_ID]')
  // Lambda START/END/REPORT
  .replace(/^(START|END|REPORT)\s+RequestId:.*$/gm, '')
  .trim();

const originalTokens = Math.ceil(raw.length / 4);
const compressedTokens = Math.ceil(compressed.length / 4);
const savings = Math.round((1 - compressedTokens / originalTokens) * 100);

console.error(`[TokenShrink] ${originalTokens} → ${compressedTokens} tokens (~${savings}% saved)`);
console.log(compressed);
