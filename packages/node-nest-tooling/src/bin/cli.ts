#!/usr/bin/env node

const commands = new Map([
  ['fix-esm-imports', 'fix-esm-imports.js'],
  ['generate-contracts', 'generate-contracts.js'],
  ['init', 'init-config.js'],
  ['openapi-diff', 'openapi-diff.js'],
  ['package-lambda', 'package-lambda.js'],
  ['setup-e2e-db', 'setup-e2e-db.js'],
  ['setup-local-db', 'setup-local-db.js'],
  ['verify-postgres-restore', 'verify-postgres-restore.js'],
]);

const [command, ...args] = process.argv.slice(2);
if (!command || command === '--help' || command === '-h') {
  console.log(
    [
      'vigilio-node <command> [options]',
      '',
      'Commands:',
      ...Array.from(commands.keys(), (name) => `  ${name}`),
    ].join('\n'),
  );
  process.exit(0);
}

const moduleName = commands.get(command);
if (!moduleName) {
  console.error(`Unknown command: ${command}`);
  process.exit(2);
}

process.argv = [process.execPath, command, ...args];
await import(new URL(`../commands/${moduleName}`, import.meta.url).href);
