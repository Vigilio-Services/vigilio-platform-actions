import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { option, type ParsedArgs } from '../args.js';

export function writeRuntimeConfig(args: ParsedArgs): void {
  const outputPath = resolve(
    option(args, 'output') ?? args.positionals[0] ?? 'dist/runtime-config.js',
  );
  const stage = process.env['VITE_STAGE'];
  const apiBaseUrl = process.env['VITE_API_BASE_URL'];
  const allowedStages = new Set(['development', 'test', 'staging', 'production']);
  if (!stage || !allowedStages.has(stage))
    throw new Error('VITE_STAGE must be development, test, staging or production.');
  if (!apiBaseUrl) throw new Error('VITE_API_BASE_URL is required.');
  const parsedApiBaseUrl = new URL(apiBaseUrl);
  if (
    parsedApiBaseUrl.protocol !== 'https:' &&
    !(stage === 'development' && parsedApiBaseUrl.hostname === 'localhost')
  ) {
    throw new Error('VITE_API_BASE_URL must use HTTPS outside localhost development.');
  }
  const parseFeatureFlag = (name: string): boolean => {
    const value = process.env[name] ?? 'true';
    if (value !== 'true' && value !== 'false') throw new Error(`${name} must be true or false.`);
    return value === 'true';
  };
  const runtimeConfig = {
    VITE_API_BASE_URL: parsedApiBaseUrl.toString().replace(/\/$/, ''),
    VITE_FEATURE_AI_CHAT: parseFeatureFlag('VITE_FEATURE_AI_CHAT'),
    VITE_FEATURE_UPLOADS: parseFeatureFlag('VITE_FEATURE_UPLOADS'),
    VITE_STAGE: stage,
  };
  mkdirSync(dirname(outputPath), { recursive: true });
  writeFileSync(
    outputPath,
    `window.__RIMAC_RUNTIME_CONFIG__ = ${JSON.stringify(runtimeConfig)};\n`,
    'utf8',
  );
  console.log(`Runtime config written: ${outputPath}`);
}
