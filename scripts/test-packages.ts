#!/usr/bin/env node

import { spawnSync } from 'node:child_process';
import { mkdir, mkdtemp, readdir, readFile, rm, stat, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';

const repositoryRoot = process.cwd();
const fixture = await mkdtemp(path.join(os.tmpdir(), 'vigilio-package-consumer-'));
const tarballs = path.join(fixture, 'tarballs');
const consumer = path.join(fixture, 'consumer');
const canonicalPackageScope = '@vigilio-services/';
const packages = await discoverPublishablePackages();

async function discoverPublishablePackages(): Promise<string[]> {
  const packagesDirectory = path.join(repositoryRoot, 'packages');
  const entries = await readdir(packagesDirectory, { withFileTypes: true });
  const discovered: string[] = [];

  for (const entry of entries) {
    if (!entry.isDirectory()) continue;
    const manifestPath = path.join(packagesDirectory, entry.name, 'package.json');
    try {
      const manifest = JSON.parse(await readFile(manifestPath, 'utf8')) as {
        readonly name?: unknown;
        readonly private?: unknown;
      };
      if (manifest.private !== true && typeof manifest.name === 'string' && manifest.name) {
        if (!manifest.name.startsWith(canonicalPackageScope)) {
          throw new Error(
            `Publishable package ${manifest.name} must use the organization scope ${canonicalPackageScope}`,
          );
        }
        discovered.push(manifest.name);
      }
    } catch (error) {
      if (isErrnoException(error) && error.code === 'ENOENT') continue;
      throw error;
    }
  }

  if (discovered.length === 0) throw new Error('No publishable workspace packages were discovered');
  return discovered.sort();
}

try {
  await mkdir(tarballs, { recursive: true });
  await mkdir(consumer, { recursive: true });
  for (const packageName of packages) {
    runPnpm(['--filter', packageName, 'pack', '--pack-destination', tarballs], repositoryRoot);
  }

  const packedFiles = (await readdir(tarballs)).filter((file) => file.endsWith('.tgz')).sort();
  if (packedFiles.length !== packages.length) {
    throw new Error(`Expected ${packages.length} tarballs, found ${packedFiles.length}`);
  }

  const packageJson = {
    name: 'vigilio-package-consumer-fixture',
    version: '1.0.0',
    private: true,
    type: 'module',
    dependencies: Object.fromEntries(
      packages.map((packageName) => {
        const unscopedName = packageName.split('/').at(-1);
        if (!unscopedName) throw new Error(`Invalid package name: ${packageName}`);
        const file = packedFiles.find((candidate) => candidate.includes(unscopedName));
        if (!file) throw new Error(`Tarball not found for ${packageName}`);
        return [packageName, `file:${path.join(tarballs, file).replaceAll('\\', '/')}`];
      }),
    ),
  };
  await writeFile(path.join(consumer, 'package.json'), `${JSON.stringify(packageJson, null, 2)}\n`);
  await writeFile(
    path.join(consumer, 'pnpm-workspace.yaml'),
    'packages:\n  - .\nstrictDepBuilds: true\ndangerouslyAllowAllBuilds: false\n',
  );
  await mkdir(path.join(consumer, 'dist', 'src'), { recursive: true });
  await writeFile(path.join(consumer, 'dist', 'src', 'main.js'), 'console.log("ready");\n');
  await writeFile(path.join(consumer, 'README.md'), 'development documentation\n');
  await writeFile(path.join(consumer, 'biome.json'), '{}\n');
  await writeFile(
    path.join(consumer, '.env.example'),
    'PUBLIC_API_URL=https://api.consumer.test\nPUBLIC_STAGE=qa\n',
  );
  await writeFile(
    path.join(consumer, 'web-mfe-tooling.config.json'),
    `${JSON.stringify(
      {
        extends: '@vigilio-services/web-mfe-tooling/presets/vite-web.json',
        bundle: { dist: 'dist', maxCssBytes: 1024, maxJsBytes: 1024 },
        publicEnv: {
          file: '.env.example',
          prefix: 'PUBLIC_',
          variables: {
            PUBLIC_API_URL: { required: true, type: 'url' },
            PUBLIC_STAGE: { required: true, type: 'enum', values: ['qa', 'production'] },
          },
        },
      },
      null,
      2,
    )}\n`,
  );
  await mkdir(path.join(consumer, '.github'), { recursive: true });
  await writeFile(
    path.join(consumer, '.github', 'evidence-policy.json'),
    `${JSON.stringify(
      {
        schema_version: 1,
        targets: ['dist', 'node_modules'],
        exclude_patterns: ['**/node_modules', '**/node_modules/**'],
        max_files: 10,
        production_stages: ['production'],
        expected_files: {},
      },
      null,
      2,
    )}\n`,
  );

  runPnpm(['install', '--ignore-scripts', '--no-frozen-lockfile'], consumer);
  const installedScope = path.join(consumer, 'node_modules', '@vigilio-services');
  await assertPathExists(path.join(installedScope, 'devsecops-evidence', 'dist', 'bin', 'cli.js'));
  await assertPathExists(path.join(installedScope, 'node-nest-tooling', 'dist', 'bin', 'cli.js'));
  await assertPathExists(path.join(installedScope, 'prompt-builder', 'dist', 'cli.js'));
  await assertPathExists(path.join(installedScope, 'vigilio-skills', 'dist', 'bin', 'cli.js'));
  await assertPathExists(path.join(installedScope, 'vigilio-skills', 'dist', 'sync.d.ts'));
  await assertPathExists(path.join(installedScope, 'web-mfe-tooling', 'dist', 'bin', 'cli.js'));
  await assertPathExists(path.join(installedScope, 'web-mfe-tooling', 'presets', 'vite-web.json'));
  await assertPathExists(path.join(installedScope, 'web-mfe-tooling', 'presets', 'vite-aws.json'));
  await assertPathMissing(path.join(installedScope, 'node-nest-tooling', 'src'));
  await assertPathMissing(path.join(installedScope, 'prompt-builder', 'src'));
  await assertPathMissing(path.join(installedScope, 'vigilio-skills', 'src'));
  await assertPathMissing(path.join(installedScope, 'web-mfe-tooling', 'src'));
  runPnpm(
    ['exec', 'vigilio-skills', 'sync', '--profile', 'core', '--profile', 'node-nest'],
    consumer,
  );
  runPnpm(
    ['exec', 'vigilio-skills', 'check', '--profile', 'core', '--profile', 'node-nest'],
    consumer,
  );
  runPnpm(['exec', 'vigilio-evidence', '--help'], consumer);
  runPnpm(
    [
      'exec',
      'vigilio-evidence',
      'write-operational',
      '--policy-file',
      '.github/evidence-policy.json',
    ],
    consumer,
  );
  await assertPathExists(path.join(consumer, 'reports', 'operational-evidence-local-local.json'));
  runPnpm(['exec', 'vigilio-node', '--help'], consumer);
  runPnpm(['exec', 'vigilio-node', 'package-lambda'], consumer);
  runPnpm(['exec', 'vigilio-prompt', '--help'], consumer);
  const promptBuilderVersion = runPnpm(['exec', 'vigilio-prompt', '--version'], consumer, {
    capture: true,
  }).trim();
  if (!/^\d+\.\d+\.\d+(?:[-+].+)?$/.test(promptBuilderVersion)) {
    throw new Error(`Invalid prompt-builder version output: ${promptBuilderVersion}`);
  }
  runPnpm(['exec', 'vigilio-web', '--help'], consumer);
  runPnpm(['exec', 'vigilio-web', 'init', '--dry-run'], consumer);
  runPnpm(['exec', 'vigilio-web', 'validate-bundle-budget'], consumer);
  runPnpm(['exec', 'vigilio-web', 'validate-public-env'], consumer);
  runPnpm(
    [
      'exec',
      'vigilio-governance',
      'validate-stage-source',
      '--stage',
      'production',
      '--ref-name',
      'main',
    ],
    consumer,
  );

  const manifest = JSON.parse(
    await readFile(path.join(consumer, '.opencode', 'skills', '.vigilio-manifest.json'), 'utf8'),
  );
  if (Object.keys(manifest.files).length === 0) {
    throw new Error('Skills manifest is empty');
  }

  const lambdaEntries = (await readdir(path.join(consumer, '.artifacts', 'lambda'))).sort();
  const expectedLambdaEntries = ['dist', 'node_modules', 'package.json', 'run.sh'];
  if (JSON.stringify(lambdaEntries) !== JSON.stringify(expectedLambdaEntries)) {
    throw new Error(`Unexpected Lambda artifact entries: ${lambdaEntries.join(', ')}`);
  }
  console.log(`Package consumer smoke passed with ${packedFiles.length} tarballs.`);
} finally {
  await rm(fixture, { force: true, recursive: true });
}

interface RunPnpmOptions {
  readonly capture?: boolean;
}

function runPnpm(args: readonly string[], cwd: string, options: RunPnpmOptions = {}): string {
  const nodeDirectory = path.dirname(process.execPath);
  const corepackPnpm =
    process.platform === 'win32'
      ? path.join(nodeDirectory, 'node_modules', 'corepack', 'dist', 'pnpm.js')
      : path.resolve(nodeDirectory, '..', 'lib', 'node_modules', 'corepack', 'dist', 'pnpm.js');
  const command = {
    executable: process.execPath,
    args: [corepackPnpm, ...args],
  };
  const result = spawnSync(command.executable, command.args, {
    cwd,
    encoding: 'utf8',
    stdio: options.capture ? 'pipe' : 'inherit',
  });
  if (result.status !== 0) {
    throw new Error(
      `pnpm ${args.join(' ')} failed with status ${result.status}: ${result.stderr ?? ''}`,
    );
  }
  return result.stdout ?? '';
}

async function assertPathExists(target: string): Promise<void> {
  await stat(target);
}

async function assertPathMissing(target: string): Promise<void> {
  try {
    await stat(target);
  } catch (error: unknown) {
    if (isErrnoException(error) && error.code === 'ENOENT') return;
    throw error;
  }
  throw new Error(`Unexpected source path in packages: ${target}`);
}

function isErrnoException(error: unknown): error is NodeJS.ErrnoException {
  return error instanceof Error && 'code' in error;
}
