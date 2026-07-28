import { readdirSync, readFileSync, statSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { option, type ParsedArgs } from '../args.js';

const defaultRequiredTokens = [
  'aiChatAskRequestDto',
  'authLoginRequestDto',
  'productIndexQueryDto',
  'productStoreRequestDto',
  'uploadCreatePresignedUrlRequestDto',
  'userIndexQueryDto',
  'userStoreRequestDto',
];

function listJavaScriptFiles(directory: string): string[] {
  return readdirSync(directory).flatMap((entry) => {
    const entryPath = join(directory, entry);
    return statSync(entryPath).isDirectory()
      ? listJavaScriptFiles(entryPath)
      : entryPath.endsWith('.js')
        ? [entryPath]
        : [];
  });
}

export async function validateContracts(args: ParsedArgs): Promise<void> {
  const packageName = option(args, 'package', '@vigilioyonatan/bus-contracts');
  if (!packageName) throw new Error('Contract package cannot be empty.');

  const packageJsonUrl = import.meta.resolve(`${packageName}/package.json`);
  const packageJsonPath = fileURLToPath(packageJsonUrl);
  const packageDirectory = dirname(packageJsonPath);
  const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf8')) as {
    readonly name?: string;
    readonly version?: string;
  };
  const contracts = (await import(packageName)) as Record<string, unknown>;
  const distPath = join(packageDirectory, 'dist');
  const contractText = listJavaScriptFiles(distPath)
    .map((file) => readFileSync(file, 'utf8'))
    .join('\n');

  const requiredTokens = (option(args, 'required') ?? defaultRequiredTokens.join(','))
    .split(',')
    .map((token) => token.trim())
    .filter(Boolean);
  const forbiddenPatterns: readonly [string, RegExp][] = [
    ['camelCase query sortBy', /\bsortBy\b/],
    ['camelCase query sortDir', /\bsortDir\b/],
    ['removed endoso contract', /\bendoso(?:Index|Show|Store|Update|Schema)/],
    ['NestJS runtime', /(?:nestjs-zod|@nestjs\/)/],
    ['backend documentation adapter', /^export .*\.doc/m],
  ];
  const missingTokens = requiredTokens.filter((token) => !(token in contracts));
  const forbiddenMatches = forbiddenPatterns
    .filter(([, pattern]) => pattern.test(contractText))
    .map(([label]) => label);

  if (missingTokens.length > 0 || forbiddenMatches.length > 0) {
    const errors = [
      'Contract governance failed.',
      ...(missingTokens.length > 0
        ? [`Missing required contract tokens: ${missingTokens.join(', ')}`]
        : []),
      ...(forbiddenMatches.length > 0
        ? [`Forbidden drift detected: ${forbiddenMatches.join(', ')}`]
        : []),
    ];
    throw new Error(errors.join('\n'));
  }

  console.log(`Contract governance validated from ${packageJson.name}@${packageJson.version}.`);
}
