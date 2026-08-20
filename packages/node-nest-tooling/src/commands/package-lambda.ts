#!/usr/bin/env node

import { spawn } from 'node:child_process';
import { createHash } from 'node:crypto';
import { chmod, cp, mkdir, readFile, rm, stat, writeFile } from 'node:fs/promises';
import path from 'node:path';
import {
  configuredOrDiscoveredProjectPath,
  configuredProjectPath,
  loadNodeNestToolingConfig,
} from '../config.js';
import { pnpmCommand } from '../internal/pnpm.js';
import { hashDirectory, pruneLambdaDeployment } from './lambda-artifact.js';
import { projectRoot, readProjectPackage } from './project-context.js';

class PnpmCommandError extends Error {
  readonly output: string;

  constructor(code: number | null, signal: NodeJS.Signals | null, output: string) {
    super(`pnpm deploy failed with code=${code} signal=${signal ?? 'none'}`);
    this.output = output;
  }
}

const config = loadNodeNestToolingConfig();
const artifactsRoot = configuredProjectPath(
  config.lambda?.artifactsDirectory,
  'VIGILIO_ARTIFACTS_DIRECTORY',
  '.artifacts',
);
const targetDirectory =
  process.env['VIGILIO_LAMBDA_TARGET_DIRECTORY'] ?? config.lambda?.targetDirectory ?? 'lambda';
const target = path.resolve(artifactsRoot, targetDirectory);
const distSource = configuredOrDiscoveredProjectPath(
  config.lambda?.distDirectory,
  'VIGILIO_DIST_DIRECTORY',
  ['dist', 'build'],
  'dist',
);
const distRelative = path.relative(projectRoot, distSource);
const distTarget = path.join(target, distRelative);

if (!target.startsWith(`${artifactsRoot}${path.sep}`)) {
  throw new Error(`Unsafe Lambda artifact target: ${target}`);
}

const configuredEntry =
  process.env['VIGILIO_LAMBDA_ENTRY'] ?? config.lambda?.entry ?? 'dist/src/main.js';
const entryPath = configuredProjectPath(
  configuredEntry,
  'VIGILIO_LAMBDA_ENTRY',
  'dist/src/main.js',
);
const lambdaEntry = path.relative(projectRoot, entryPath).replaceAll('\\', '/');
await stat(entryPath);
await rm(target, { force: true, recursive: true });
await mkdir(artifactsRoot, { recursive: true });
await deployProductionDependencies(target);

const extraRuntimeEntries = (process.env['VIGILIO_LAMBDA_INCLUDE'] ?? '')
  .split(',')
  .map((entry) => entry.trim())
  .filter(Boolean);
await pruneLambdaDeployment(target, extraRuntimeEntries);
await mkdir(path.dirname(distTarget), { recursive: true });
await cp(distSource, distTarget, { recursive: true });

const startupScript = `#!/bin/sh\nexec node ${lambdaEntry}\n`;
const startupPath = path.join(target, 'run.sh');
await writeFile(startupPath, startupScript, { encoding: 'utf8' });
await chmod(startupPath, 0o755);

const assetHash = createHash('sha256');
await hashDirectory(distSource, assetHash);
for (const file of ['package.json', 'pnpm-lock.yaml', 'pnpm-workspace.yaml']) {
  assetHash.update(file);
  assetHash.update(await readFile(path.join(projectRoot, file)));
}
assetHash.update(startupScript);
await writeFile(path.join(artifactsRoot, 'lambda.asset-hash'), assetHash.digest('hex'), 'utf8');

console.log(`Lambda artifact ready: ${target}`);

async function deployProductionDependencies(deployTarget: string): Promise<void> {
  const deployArgs = ['--filter', readProjectPackage().name, 'deploy', '--prod', deployTarget];
  const workspaceFile = path.join(projectRoot, 'pnpm-workspace.yaml');
  const workspaceConfig = await readFile(workspaceFile, 'utf8');
  const usesInjectedWorkspacePackages = /^\s*injectWorkspacePackages:\s*true\s*$/m.test(
    workspaceConfig,
  );

  if (!usesInjectedWorkspacePackages) {
    console.warn(
      'Workspace injection is disabled; using pnpm deploy compatibility mode. ' +
        'Prefer injectWorkspacePackages: true in pnpm-workspace.yaml.',
    );
    await runPnpm([...deployArgs.slice(0, 3), '--legacy', ...deployArgs.slice(3)]);
    return;
  }

  try {
    await runPnpm(deployArgs);
  } catch (error) {
    if (!(error instanceof PnpmCommandError)) {
      throw error;
    }
    if (!error.output.includes('ERR_PNPM_DEPLOY_NONINJECTED_WORKSPACE')) {
      throw error;
    }

    console.warn(
      'Workspace injection is disabled; retrying pnpm deploy with compatibility mode. ' +
        'Prefer injectWorkspacePackages: true in pnpm-workspace.yaml.',
    );
    await rm(deployTarget, { force: true, recursive: true });
    await runPnpm([...deployArgs.slice(0, 3), '--legacy', ...deployArgs.slice(3)]);
  }
}

function runPnpm(args: string[]): Promise<void> {
  const command = pnpmCommand(args);

  return new Promise<void>((resolve, reject) => {
    let output = '';
    const child = spawn(command.executable, command.args, {
      cwd: projectRoot,
      env: process.env,
      shell: false,
      stdio: ['inherit', 'pipe', 'pipe'],
    });

    child.stdout.on('data', (chunk) => {
      const text = chunk.toString();
      output += text;
      process.stdout.write(text);
    });
    child.stderr.on('data', (chunk) => {
      const text = chunk.toString();
      output += text;
      process.stderr.write(text);
    });
    child.once('error', reject);
    child.once('exit', (code, signal) => {
      if (code === 0 && !signal) {
        resolve();
        return;
      }

      reject(new PnpmCommandError(code, signal, output));
    });
  });
}
