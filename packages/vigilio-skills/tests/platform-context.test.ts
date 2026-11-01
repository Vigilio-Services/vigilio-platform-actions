import assert from 'node:assert/strict';
import { cp, mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { test } from 'vitest';
import {
  PlatformContextValidationError,
  platformContextRelativePath,
  validatePlatformContext,
} from '../src/platform-context.js';

const packageRoot = path.resolve(import.meta.dirname, '..');
const schemaFile = path.join(
  packageRoot,
  'assets',
  'docs',
  'schemas',
  'platform-context.schema.json',
);
const templateFile = path.join(
  packageRoot,
  'templates',
  'project',
  '.vigilio',
  'platform-context.yaml',
);

test('validates the explicit platform context template', async () => {
  const fixture = await mkdtemp(path.join(tmpdir(), 'vigilio-platform-context-'));
  try {
    const contextFile = path.join(fixture, platformContextRelativePath);
    await mkdir(path.dirname(contextFile), { recursive: true });
    await cp(templateFile, contextFile);

    const result = await validatePlatformContext(fixture, schemaFile);
    assert.equal(result.status, 'PASS');
    if (result.status === 'PASS') {
      assert.equal(result.context.schemaVersion, 1);
      assert.equal(result.context.delivery?.gitopsEngine, 'argocd');
    }
  } finally {
    await rm(fixture, { force: true, recursive: true });
  }
});

test('returns NOT_RUN when the optional context does not exist', async () => {
  const fixture = await mkdtemp(path.join(tmpdir(), 'vigilio-platform-context-'));
  try {
    const result = await validatePlatformContext(fixture, schemaFile);
    assert.equal(result.status, 'NOT_RUN');
  } finally {
    await rm(fixture, { force: true, recursive: true });
  }
});

test('rejects absolute and escaping repository paths', async () => {
  const fixture = await mkdtemp(path.join(tmpdir(), 'vigilio-platform-context-'));
  try {
    const contextFile = path.join(fixture, platformContextRelativePath);
    await mkdir(path.dirname(contextFile), { recursive: true });
    await writeFile(
      contextFile,
      `schemaVersion: 1
project:
  name: ecommerce
  type: platform
repositories:
  application: C:/Users/example/apps
  infrastructure: ../infra
  gitops: deploy
  images: docker
environments: [local, production]
`,
      'utf8',
    );

    await assert.rejects(
      validatePlatformContext(fixture, schemaFile),
      PlatformContextValidationError,
    );
  } finally {
    await rm(fixture, { force: true, recursive: true });
  }
});
