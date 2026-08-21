import { readFileSync } from 'node:fs';
import path from 'node:path';
import { isRecord } from './object.js';

export function readJson(file: string, errors: string[]): Record<string, unknown> | undefined {
  try {
    const value: unknown = JSON.parse(readFileSync(file, 'utf8'));
    if (!isRecord(value)) throw new Error('root must be an object');
    return value;
  } catch (error) {
    errors.push(
      `${path.basename(file)}: ${error instanceof Error ? error.message : String(error)}`,
    );
    return undefined;
  }
}

export function readText(file: string, errors: string[]): string | undefined {
  try {
    return readFileSync(file, 'utf8');
  } catch (error) {
    errors.push(
      `${path.basename(file)}: ${error instanceof Error ? error.message : String(error)}`,
    );
    return undefined;
  }
}

export function yamlScalar(content: string, key: string): string {
  const escaped = key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return new RegExp(`^${escaped}:\\s*['"]?([^'"\\s#]+)`, 'm').exec(content)?.[1] ?? '';
}
