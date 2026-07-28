#!/usr/bin/env node

import { parseArgs } from '../args.js';
import { generateSbom } from '../commands/generate-sbom.js';
import { validateBundleBudget } from '../commands/validate-bundle-budget.js';
import { validateContracts } from '../commands/validate-contracts.js';
import { validateOpenApi } from '../commands/validate-openapi.js';
import { validatePublicEnv } from '../commands/validate-public-env.js';
import { validateSecurityHeaders } from '../commands/validate-security-headers.js';
import { writeRuntimeConfig } from '../commands/write-runtime-config.js';

const commands = new Map<string, (args: ReturnType<typeof parseArgs>) => void | Promise<void>>([
  ['validate-contracts', validateContracts],
  ['validate-openapi', validateOpenApi],
  ['validate-bundle-budget', validateBundleBudget],
  ['validate-public-env', validatePublicEnv],
  ['validate-security-headers', validateSecurityHeaders],
  ['write-runtime-config', writeRuntimeConfig],
  ['generate-sbom', generateSbom],
]);

const [command, ...input] = process.argv.slice(2);
if (!command || command === '--help' || command === '-h') {
  console.log(
    [
      'vigilio-web <command> [options]',
      '',
      'Commands:',
      ...[...commands.keys()].map((name) => `  ${name}`),
    ].join('\n'),
  );
  process.exit(0);
}

const handler = commands.get(command);
if (!handler) {
  console.error(`Unknown command: ${command}`);
  process.exit(2);
}

try {
  await handler(parseArgs(input));
} catch (error) {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
}
