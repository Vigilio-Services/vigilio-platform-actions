import { option, type ParsedArgs } from '../args.js';
import {
  loadConfig,
  readDotEnvFile,
  resolveRuntimeVariables,
  type WebMfeToolingConfig,
} from '../config.js';
import { validatePublicEnv } from './validate-public-env.js';

function configuredSections(config: WebMfeToolingConfig): number {
  return [
    config.bundle,
    config.contracts,
    config.openApi,
    config.publicEnv,
    config.runtimeConfig,
    config.sbom,
    config.securityHeaders,
  ].filter(Boolean).length;
}

export function validateConfig(args: ParsedArgs): void {
  const config = loadConfig(args);
  if (configuredSections(config) === 0) {
    throw new Error('A configured web-mfe-tooling policy is required for validate-config.');
  }

  const errors: string[] = [];
  if (config.publicEnv) validatePublicEnv(args);

  const publicVariables = config.publicEnv?.variables ?? {};
  const runtimeVariables = resolveRuntimeVariables(config) ?? {};
  const envFile = option(args, 'file') ?? config.publicEnv?.file ?? '.env.example';
  const envKeys = config.publicEnv ? new Set(readDotEnvFile(envFile).keys()) : new Set<string>();

  if (config.runtimeConfig?.requirePublicEnvParity) {
    const missingRuntimeVariables = Object.keys(publicVariables).filter(
      (name) => !(name in runtimeVariables),
    );
    const undeclaredRuntimeVariables = Object.keys(runtimeVariables).filter(
      (name) => !(name in publicVariables),
    );
    const undocumentedRuntimeVariables = Object.keys(runtimeVariables).filter(
      (name) => !envKeys.has(name),
    );
    if (missingRuntimeVariables.length > 0) {
      errors.push(
        `Public variables missing from runtime config: ${missingRuntimeVariables.join(', ')}`,
      );
    }
    if (undeclaredRuntimeVariables.length > 0) {
      errors.push(
        `Runtime variables missing from publicEnv.variables: ${undeclaredRuntimeVariables.join(', ')}`,
      );
    }
    if (undocumentedRuntimeVariables.length > 0) {
      errors.push(
        `Runtime variables missing from ${envFile}: ${undocumentedRuntimeVariables.join(', ')}`,
      );
    }
  }

  if (errors.length > 0) {
    throw new Error(
      [
        'web-mfe-tooling configuration drift detected:',
        ...errors.map((error) => `- ${error}`),
      ].join('\n'),
    );
  }
  console.log('web-mfe-tooling configuration is synchronized.');
}
