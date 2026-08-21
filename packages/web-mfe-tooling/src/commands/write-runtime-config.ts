import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { option, type ParsedArgs } from '../args.js';
import { loadConfig, parseConfiguredValue, resolveRuntimeVariables } from '../config.js';

export function writeRuntimeConfig(args: ParsedArgs): void {
  const toolingConfig = loadConfig(args);
  const config = toolingConfig.runtimeConfig;
  if (!config) {
    throw new Error(
      'Runtime configuration policy is not configured. Set runtimeConfig or run vigilio-web init.',
    );
  }
  const outputPath = resolve(
    option(args, 'output') ?? args.positionals[0] ?? config.output ?? 'dist/runtime-config.js',
  );
  const variables = resolveRuntimeVariables(toolingConfig);
  if (!variables || Object.keys(variables).length === 0) {
    throw new Error('runtimeConfig.variables must define at least one public variable.');
  }
  const runtimeConfig = Object.fromEntries(
    Object.entries(variables).flatMap(([name, rule]) => {
      const value = parseConfiguredValue(name, process.env[name], rule);
      return value === undefined ? [] : [[name, value]];
    }),
  );
  const globalName = config.globalName ?? '__APP_RUNTIME_CONFIG__';
  if (!/^[$A-Z_a-z][$\w]*$/.test(globalName)) {
    throw new Error(
      `runtimeConfig.globalName must be a valid JavaScript identifier: ${globalName}`,
    );
  }
  const serialized = JSON.stringify(runtimeConfig);
  const assignmentValue = config.freeze ? `Object.freeze(${serialized})` : serialized;

  mkdirSync(dirname(outputPath), { recursive: true });
  writeFileSync(outputPath, `window.${globalName} = ${assignmentValue};\n`, 'utf8');
  console.log(`Runtime config written: ${outputPath}`);
}
