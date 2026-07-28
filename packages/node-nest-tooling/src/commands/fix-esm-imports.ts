#!/usr/bin/env node

import { existsSync } from 'node:fs';
import { readdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { projectRoot } from './project-context.js';

const distRoot = resolveDistRoot(process.argv.slice(2));

await rewriteDirectory(distRoot);

async function rewriteDirectory(directory: string): Promise<void> {
  if (!existsSync(directory)) {
    return;
  }

  const entries = await readdir(directory, { withFileTypes: true });
  for (const entry of entries) {
    const entryPath = path.join(directory, entry.name);

    if (entry.isDirectory()) {
      await rewriteDirectory(entryPath);
      continue;
    }

    if (entry.isFile() && entry.name.endsWith('.js')) {
      await rewriteFile(entryPath);
    }
  }
}

async function rewriteFile(filePath: string): Promise<void> {
  const originalContent = await readFile(filePath, 'utf8');
  let content = originalContent;

  content = content.replace(
    /(from\s+["'])(\.{1,2}\/[^"']+)(["'])/g,
    (_match, prefix, specifier, suffix) =>
      `${prefix}${resolveNodeEsmSpecifier(filePath, specifier)}${suffix}`,
  );
  content = content.replace(
    /(from\s+["'])(@\/[^"']+)(["'])/g,
    (_match, prefix, specifier, suffix) => {
      return `${prefix}${resolveNodeEsmSpecifier(filePath, specifier)}${suffix}`;
    },
  );

  content = content.replace(
    /(import\s+["'])(\.{1,2}\/[^"']+)(["'])/g,
    (_match, prefix, specifier, suffix) =>
      `${prefix}${resolveNodeEsmSpecifier(filePath, specifier)}${suffix}`,
  );
  content = content.replace(
    /(import\s+["'])(@\/[^"']+)(["'])/g,
    (_match, prefix, specifier, suffix) => {
      return `${prefix}${resolveNodeEsmSpecifier(filePath, specifier)}${suffix}`;
    },
  );

  content = content.replace(
    /(import\(\s*["'])(\.{1,2}\/[^"']+)(["']\s*\))/g,
    (_match, prefix, specifier, suffix) =>
      `${prefix}${resolveNodeEsmSpecifier(filePath, specifier)}${suffix}`,
  );
  content = content.replace(
    /(import\(\s*["'])(@\/[^"']+)(["']\s*\))/g,
    (_match, prefix, specifier, suffix) =>
      `${prefix}${resolveNodeEsmSpecifier(filePath, specifier)}${suffix}`,
  );

  if (content !== originalContent) {
    await writeFile(filePath, content);
  }
}

function resolveNodeEsmSpecifier(filePath: string, specifier: string): string {
  if (hasRuntimeExtension(specifier)) {
    return specifier;
  }

  const fileDirectory = path.dirname(filePath);
  const resolvedPath = specifier.startsWith('@/')
    ? path.join(distRoot, 'src', specifier.slice(2))
    : path.resolve(fileDirectory, specifier);

  if (existsSync(`${resolvedPath}.js`)) {
    return toImportSpecifier(fileDirectory, `${resolvedPath}.js`, specifier);
  }

  if (existsSync(path.join(resolvedPath, 'index.js'))) {
    return toImportSpecifier(fileDirectory, path.join(resolvedPath, 'index.js'), specifier);
  }

  return specifier;
}

function toImportSpecifier(
  fileDirectory: string,
  resolvedFilePath: string,
  originalSpecifier: string,
): string {
  if (!originalSpecifier.startsWith('@/')) {
    return `${originalSpecifier}${resolvedFilePath.endsWith('index.js') ? '/index.js' : '.js'}`;
  }

  const relativePath = path.relative(fileDirectory, resolvedFilePath).replaceAll(path.sep, '/');
  return relativePath.startsWith('.') ? relativePath : `./${relativePath}`;
}

function hasRuntimeExtension(specifier: string): boolean {
  return /\.(cjs|mjs|js|json|node)(?:[?#].*)?$/.test(specifier);
}

function resolveDistRoot(args: string[]): string {
  const optionIndex = args.indexOf('--dist-root');
  if (optionIndex === -1) return path.join(projectRoot, 'dist');

  const configuredPath = args[optionIndex + 1];
  if (!configuredPath || configuredPath.startsWith('--')) {
    throw new Error('fix-esm-imports requires a path after --dist-root.');
  }

  return path.resolve(projectRoot, configuredPath);
}
