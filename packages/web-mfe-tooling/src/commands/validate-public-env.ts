import { option, type ParsedArgs } from '../args.js';
import { csvOption, loadConfig, parseConfiguredValue, readDotEnvFile } from '../config.js';

export function validatePublicEnv(args: ParsedArgs): void {
  const config = loadConfig(args).publicEnv;
  if (!config) {
    throw new Error(
      'Public environment policy is not configured. Set publicEnv or run vigilio-web init.',
    );
  }
  const file = option(args, 'file') ?? config.file ?? '.env.example';
  const entries = readDotEnvFile(file);
  const variables = config.variables ?? {};
  const requiredKeys = csvOption(
    args,
    'required',
    Object.entries(variables)
      .filter(([, rule]) => rule.required)
      .map(([key]) => key),
  );
  const prefix = config.prefix ?? '';
  const forbiddenFragments = config.forbiddenNameFragments ?? [
    'SECRET',
    'TOKEN',
    'PASSWORD',
    'PRIVATE',
    'SESSION',
    'COOKIE',
  ];
  const errors: string[] = [];
  const environment = Object.fromEntries(entries);

  for (const key of requiredKeys) {
    if (!entries.has(key)) errors.push(`${file} must include ${key}`);
  }
  for (const key of entries.keys()) {
    if (prefix && !key.startsWith(prefix)) {
      errors.push(`${key} must be prefixed with ${prefix} or removed from ${file}`);
    }
    if (forbiddenFragments.some((fragment) => key.includes(fragment))) {
      errors.push(`${key} looks sensitive and must not be public`);
    }
    if (config.enforceDeclaredVariables && !(key in variables)) {
      errors.push(`${key} must be declared in publicEnv.variables`);
    }
  }

  for (const [key, rule] of Object.entries(variables)) {
    try {
      parseConfiguredValue(key, entries.get(key), rule, environment);
    } catch (error) {
      errors.push(error instanceof Error ? error.message : String(error));
    }
  }

  if (errors.length > 0) {
    throw new Error(
      ['Public env validation failed:', ...errors.map((error) => `- ${error}`)].join('\n'),
    );
  }
  console.log('Public env policy validated.');
}
