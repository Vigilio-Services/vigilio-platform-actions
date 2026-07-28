import { readFileSync } from 'node:fs';
import { option, type ParsedArgs } from '../args.js';

function parseDotEnvFile(path: string): Map<string, string> {
  const entries = new Map<string, string>();
  for (const line of readFileSync(path, 'utf8').split(/\r?\n/)) {
    const trimmed = line.trim();
    const separator = trimmed.indexOf('=');
    if (!trimmed || trimmed.startsWith('#') || separator < 0) continue;
    entries.set(
      trimmed.slice(0, separator).trim(),
      trimmed
        .slice(separator + 1)
        .trim()
        .replace(/^["']|["']$/g, ''),
    );
  }
  return entries;
}

export function validatePublicEnv(args: ParsedArgs): void {
  const file = option(args, 'file', '.env.example') ?? '.env.example';
  const entries = parseDotEnvFile(file);
  const requiredKeys = (
    option(
      args,
      'required',
      'VITE_API_BASE_URL,VITE_FEATURE_AI_CHAT,VITE_FEATURE_UPLOADS,VITE_STAGE',
    ) ?? ''
  )
    .split(',')
    .map((key) => key.trim())
    .filter(Boolean);
  const allowedStages = new Set(
    (option(args, 'stages', 'development,test,staging,production') ?? '').split(','),
  );
  const forbiddenFragments = ['SECRET', 'TOKEN', 'PASSWORD', 'PRIVATE', 'SESSION', 'COOKIE'];
  const errors: string[] = [];
  for (const key of requiredKeys) if (!entries.has(key)) errors.push(`${file} must include ${key}`);
  for (const key of entries.keys()) {
    if (!key.startsWith('VITE_'))
      errors.push(`${key} must be prefixed with VITE_ or removed from ${file}`);
    if (forbiddenFragments.some((fragment) => key.includes(fragment)))
      errors.push(`${key} looks sensitive and must not be public`);
  }
  const apiBaseUrl = entries.get('VITE_API_BASE_URL');
  const stage = entries.get('VITE_STAGE');
  if (
    apiBaseUrl &&
    !apiBaseUrl.startsWith('https://') &&
    !apiBaseUrl.startsWith('http://localhost')
  ) {
    errors.push('VITE_API_BASE_URL must use https, except http://localhost for local dev');
  }
  if (stage && !allowedStages.has(stage))
    errors.push(`VITE_STAGE must be one of ${[...allowedStages].join(', ')}`);
  for (const key of ['VITE_FEATURE_AI_CHAT', 'VITE_FEATURE_UPLOADS']) {
    const value = entries.get(key);
    if (value && value !== 'true' && value !== 'false') errors.push(`${key} must be true or false`);
  }
  if (errors.length > 0)
    throw new Error(
      ['Public env validation failed:', ...errors.map((error) => `- ${error}`)].join('\n'),
    );
  console.log('Public env policy validated.');
}
