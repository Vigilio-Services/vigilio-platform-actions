import { readdirSync, readFileSync, statSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { option, type ParsedArgs } from '../args.js';
import { compilePattern, csvOption, loadConfig, type PatternRule } from '../config.js';

type PackageJson = {
  readonly name: string;
  readonly version: string;
};

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
  const config = loadConfig(args).contracts;
  const packageName = option(args, 'package') ?? config?.package;
  if (!packageName) {
    throw new Error(
      'Contract package is not configured. Set contracts.package, pass --package, or run vigilio-web init.',
    );
  }

  const consumerRequire = createRequire(join(process.cwd(), 'package.json'));
  const packageJsonPath = consumerRequire.resolve(`${packageName}/package.json`);
  const packageEntryPath = consumerRequire.resolve(packageName);
  const packageDirectory = dirname(packageJsonPath);
  const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf8')) as PackageJson;
  const contracts = (await import(pathToFileURL(packageEntryPath).href)) as Readonly<
    Record<string, unknown>
  >;
  const requiredTokens = csvOption(args, 'required', config?.requiredExports ?? []);
  const defaultForbiddenPatterns: readonly PatternRule[] = [
    {
      label: 'backend framework runtime',
      pattern: '(?:nestjs-zod|@nestjs/|@prisma/client|typeorm)',
    },
    {
      label: 'Node.js server runtime',
      pattern: '(?:node:)?(?:child_process|fs|net|tls)(?:/|[\'"]|$)',
    },
    { flags: 'm', label: 'backend documentation adapter', pattern: '^export .*\\.doc' },
  ];
  const forbiddenPatterns = config?.forbiddenPatterns ?? defaultForbiddenPatterns;
  const distPath = join(packageDirectory, config?.scanDirectory ?? 'dist');
  const contractText =
    forbiddenPatterns.length === 0
      ? ''
      : listJavaScriptFiles(distPath)
          .map((file) => readFileSync(file, 'utf8'))
          .join('\n');
  const missingTokens = requiredTokens.filter((token) => !(token in contracts));
  const forbiddenMatches = forbiddenPatterns
    .filter((rule) => compilePattern(rule).test(contractText))
    .map(({ label }) => label);

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
