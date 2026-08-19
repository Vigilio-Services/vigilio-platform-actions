import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { parseArgs } from '../src/args.js';
import { initializeConfig } from '../src/commands/init-config.js';
import { validateBundleBudget } from '../src/commands/validate-bundle-budget.js';
import { validateConfig } from '../src/commands/validate-config.js';
import { validateContracts } from '../src/commands/validate-contracts.js';
import { validateOpenApi } from '../src/commands/validate-openapi.js';
import { validatePublicEnv } from '../src/commands/validate-public-env.js';
import { validateSecurityHeaders } from '../src/commands/validate-security-headers.js';
import { writeRuntimeConfig } from '../src/commands/write-runtime-config.js';
import { loadConfig } from '../src/config.js';

const temporaryDirectories: string[] = [];

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
  for (const directory of temporaryDirectories.splice(0)) {
    rmSync(directory, { force: true, recursive: true });
  }
});

function temporaryDirectory(): string {
  const directory = mkdtempSync(join(tmpdir(), 'vigilio-web-test-'));
  temporaryDirectories.push(directory);
  return directory;
}

function writeConfig(directory: string, config: unknown): string {
  const path = join(directory, 'web-mfe-tooling.config.json');
  writeFileSync(path, JSON.stringify(config));
  return path;
}

describe('web MFE commands', () => {
  it('validates public variables and rejects sensitive names', () => {
    const directory = temporaryDirectory();
    const validFile = join(directory, '.env.valid');
    const invalidFile = join(directory, '.env.invalid');
    writeFileSync(
      validFile,
      'PUBLIC_API_URL=https://api.example.com\nPUBLIC_FEATURE_ORDERS=true\nPUBLIC_STAGE=production\n',
    );
    writeFileSync(
      invalidFile,
      'PUBLIC_API_URL=https://api.example.com\nPUBLIC_FEATURE_ORDERS=true\nPUBLIC_STAGE=production\nPUBLIC_ACCESS_TOKEN=secret\n',
    );
    const configPath = writeConfig(directory, {
      publicEnv: {
        enforceDeclaredVariables: true,
        file: validFile,
        forbiddenNameFragments: ['SECRET', 'TOKEN'],
        prefix: 'PUBLIC_',
        variables: {
          PUBLIC_API_URL: { required: true, type: 'url' },
          PUBLIC_FEATURE_ORDERS: { required: true, type: 'boolean' },
          PUBLIC_STAGE: { required: true, type: 'enum', values: ['production'] },
        },
      },
    });

    expect(() => validatePublicEnv(parseArgs(['--config', configPath]))).not.toThrow();
    expect(() =>
      validatePublicEnv(parseArgs(['--config', configPath, '--file', invalidFile])),
    ).toThrow('PUBLIC_ACCESS_TOKEN looks sensitive');
  });

  it('fails closed when consumer-owned policy is missing', async () => {
    expect(() => validatePublicEnv(parseArgs([]))).toThrow(
      'Public environment policy is not configured',
    );
    expect(() => writeRuntimeConfig(parseArgs([]))).toThrow(
      'Runtime configuration policy is not configured',
    );
    expect(() => validateOpenApi(parseArgs([]))).toThrow('OpenAPI path is not configured');
    await expect(validateContracts(parseArgs([]))).rejects.toThrow(
      'Contract package is not configured',
    );
  });

  it('enforces JavaScript and CSS bundle budgets', () => {
    const directory = temporaryDirectory();
    mkdirSync(join(directory, 'assets'));
    writeFileSync(join(directory, 'assets', 'app.js'), '12345');
    writeFileSync(join(directory, 'assets', 'app.css'), '123');

    expect(() =>
      validateBundleBudget(parseArgs(['--dist', directory, '--max-js', '5', '--max-css', '3'])),
    ).not.toThrow();
    expect(() => validateBundleBudget(parseArgs(['--dist', directory, '--max-js', '4']))).toThrow(
      'JS budget exceeded',
    );
  });

  it('validates required and forbidden OpenAPI paths', () => {
    const directory = temporaryDirectory();
    const document = join(directory, 'openapi.json');
    writeFileSync(document, JSON.stringify({ paths: { '/health': {}, '/users': {} } }));

    expect(() =>
      validateOpenApi(
        parseArgs([
          '--path',
          document,
          '--required',
          '/health,/users',
          '--forbid-prefix',
          '/deprecated',
        ]),
      ),
    ).not.toThrow();
    expect(() =>
      validateOpenApi(parseArgs(['--path', document, '--required', '/missing'])),
    ).toThrow('Missing paths: /missing');
  });

  it('writes only allowlisted public runtime configuration', () => {
    const directory = temporaryDirectory();
    const output = join(directory, 'runtime-config.js');
    const configPath = writeConfig(directory, {
      runtimeConfig: {
        output,
        variables: {
          PUBLIC_API_URL: { required: true, type: 'url' },
          PUBLIC_FEATURE_ORDERS: { required: true, type: 'boolean' },
          PUBLIC_STAGE: { required: true, type: 'enum', values: ['production'] },
        },
      },
    });
    vi.stubEnv('PUBLIC_STAGE', 'production');
    vi.stubEnv('PUBLIC_API_URL', 'https://api.example.com/');
    vi.stubEnv('PUBLIC_FEATURE_ORDERS', 'false');

    writeRuntimeConfig(parseArgs(['--config', configPath]));

    expect(readFileSync(output, 'utf8')).toBe(
      'window.__APP_RUNTIME_CONFIG__ = {"PUBLIC_API_URL":"https://api.example.com","PUBLIC_FEATURE_ORDERS":false,"PUBLIC_STAGE":"production"};\n',
    );
  });

  it('validates browser security headers', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(
        async () =>
          new Response('<!doctype html>', {
            headers: {
              'content-security-policy': "default-src 'self'",
              'permissions-policy': 'camera=()',
              'referrer-policy': 'strict-origin-when-cross-origin',
              'strict-transport-security': 'max-age=31536000',
              'x-content-type-options': 'nosniff',
              'x-robots-tag': 'noindex, nofollow',
            },
            status: 200,
          }),
      ),
    );

    await expect(
      validateSecurityHeaders(parseArgs(['https://frontend.example.com'])),
    ).resolves.toBeUndefined();
  });

  it('loads consumer configuration and rejects an explicit missing file', () => {
    const directory = temporaryDirectory();
    const configPath = writeConfig(directory, { bundle: { maxJsBytes: 1234 } });

    expect(loadConfig(parseArgs(['--config', configPath])).bundle?.maxJsBytes).toBe(1234);
    expect(() => loadConfig(parseArgs(['--config', join(directory, 'missing.json')]))).toThrow(
      'config not found',
    );
  });

  it('merges inherited configuration while preserving consumer overrides', () => {
    const directory = temporaryDirectory();
    const basePath = join(directory, 'base.json');
    const configPath = join(directory, 'web-mfe-tooling.config.json');
    writeFileSync(
      basePath,
      JSON.stringify({
        bundle: { dist: 'build', maxCssBytes: 100, maxJsBytes: 200 },
        contracts: { forbiddenPatterns: [{ label: 'server runtime', pattern: '@nestjs/' }] },
      }),
    );
    writeFileSync(
      configPath,
      JSON.stringify({
        extends: './base.json',
        bundle: { maxJsBytes: 300 },
        contracts: { package: '@acme/contracts' },
      }),
    );

    expect(loadConfig(parseArgs(['--config', configPath]))).toEqual({
      bundle: { dist: 'build', maxCssBytes: 100, maxJsBytes: 300 },
      contracts: {
        forbiddenPatterns: [{ label: 'server runtime', pattern: '@nestjs/' }],
        package: '@acme/contracts',
      },
    });
  });

  it('initializes a version-aware proposal without overwriting existing policy', () => {
    const directory = temporaryDirectory();
    const frontend = join(directory, 'customer-web-v2');
    const backendV1 = join(directory, 'orders-api', 'docs', 'openapi');
    const backendV2 = join(directory, 'orders-api-v2', 'docs', 'openapi');
    const source = join(frontend, 'src');
    mkdirSync(frontend);
    mkdirSync(backendV1, { recursive: true });
    mkdirSync(backendV2, { recursive: true });
    mkdirSync(source);
    writeFileSync(
      join(frontend, 'package.json'),
      JSON.stringify({
        dependencies: { '@acme/orders-v2-contracts': '2026.8.0' },
        name: 'customer-web-v2',
      }),
    );
    writeFileSync(
      join(source, 'contracts.ts'),
      [
        "import { createOrderRequest, listOrdersQuery as OrdersQuery, type ListOrdersQuery } from '@acme/orders-v2-contracts';",
        "import { useQuery } from '@tanstack/react-query';",
        'window.__CUSTOM_RUNTIME_CONFIG__;',
      ].join('\n'),
    );
    writeFileSync(
      join(frontend, '.env.example'),
      'VITE_API_BASE_URL=https://api.example.com\nVITE_FEATURE_CHAT=true\nVITE_STAGE=production\n',
    );
    writeFileSync(join(backendV1, 'openapi.json'), JSON.stringify({ paths: { '/legacy': {} } }));
    writeFileSync(
      join(backendV2, 'openapi.json'),
      JSON.stringify({
        paths: { '/health': {}, '/metrics': {}, '/orders': {}, '/orders/{id}': {} },
      }),
    );

    const args = parseArgs(['--root', frontend]);
    const result = initializeConfig(args);

    expect(result.written).toBe(true);
    expect(result.config.contracts).toMatchObject({
      package: '@acme/orders-v2-contracts',
      requiredExports: ['createOrderRequest', 'listOrdersQuery'],
    });
    expect(result.config.openApi).toMatchObject({
      path: '../orders-api-v2/docs/openapi/openapi.json',
      requiredPaths: ['/orders', '/orders/{id}'],
    });
    expect(result.config.publicEnv).toMatchObject({ prefix: 'VITE_' });
    expect(result.config.runtimeConfig).toMatchObject({
      globalName: '__CUSTOM_RUNTIME_CONFIG__',
    });
    expect(() => initializeConfig(args)).toThrow('Refusing to overwrite existing config');
  });

  it('uses consumer-specific bundle, OpenAPI and public environment policies', () => {
    const directory = temporaryDirectory();
    const dist = join(directory, 'build-output');
    const openApi = join(directory, 'service-api.json');
    const envFile = join(directory, '.env.consumer');
    mkdirSync(dist);
    writeFileSync(join(dist, 'app.js'), '12345');
    writeFileSync(openApi, JSON.stringify({ paths: { '/orders': {} } }));
    writeFileSync(envFile, 'PUBLIC_API_URL=https://api.acme.test\nPUBLIC_STAGE=qa\n');
    const configPath = writeConfig(directory, {
      bundle: { dist, maxCssBytes: 0, maxJsBytes: 5 },
      openApi: { path: openApi, requiredPaths: ['/orders'] },
      publicEnv: {
        file: envFile,
        prefix: 'PUBLIC_',
        variables: {
          PUBLIC_API_URL: { required: true, type: 'url' },
          PUBLIC_STAGE: { required: true, type: 'enum', values: ['qa', 'production'] },
        },
      },
    });
    const args = parseArgs(['--config', configPath]);

    expect(() => validateBundleBudget(args)).not.toThrow();
    expect(() => validateOpenApi(args)).not.toThrow();
    expect(() => validatePublicEnv(args)).not.toThrow();
  });

  it('detects undeclared public variables and validates runtime inheritance', () => {
    const directory = temporaryDirectory();
    const envFile = join(directory, '.env.consumer');
    const output = join(directory, 'runtime-config.js');
    writeFileSync(
      envFile,
      'PUBLIC_API_URL=https://api.acme.test\nPUBLIC_FEATURE_ORDERS=true\nPUBLIC_SAMPLE_RATE=0.25\n',
    );
    const configPath = writeConfig(directory, {
      publicEnv: {
        enforceDeclaredVariables: true,
        file: envFile,
        prefix: 'PUBLIC_',
        variables: {
          PUBLIC_API_URL: { required: true, type: 'url' },
        },
      },
      runtimeConfig: {
        inheritPublicEnv: true,
        requirePublicEnvParity: true,
      },
    });

    expect(() => validateConfig(parseArgs(['--config', configPath]))).toThrow(
      'PUBLIC_FEATURE_ORDERS must be declared',
    );

    writeConfig(directory, {
      publicEnv: {
        enforceDeclaredVariables: true,
        file: envFile,
        prefix: 'PUBLIC_',
        variables: {
          PUBLIC_API_URL: { required: true, type: 'url' },
          PUBLIC_FEATURE_ORDERS: { required: true, type: 'boolean' },
          PUBLIC_SAMPLE_RATE: {
            maximum: 1,
            minimum: 0,
            required: true,
            type: 'number',
          },
        },
      },
      runtimeConfig: {
        inheritPublicEnv: true,
        output,
        requirePublicEnvParity: true,
      },
    });
    const args = parseArgs(['--config', configPath]);
    expect(() => validateConfig(args)).not.toThrow();

    vi.stubEnv('PUBLIC_API_URL', 'https://api.acme.test');
    vi.stubEnv('PUBLIC_FEATURE_ORDERS', 'true');
    vi.stubEnv('PUBLIC_SAMPLE_RATE', '0.25');
    writeRuntimeConfig(args);
    expect(readFileSync(output, 'utf8')).toBe(
      'window.__APP_RUNTIME_CONFIG__ = {"PUBLIC_API_URL":"https://api.acme.test","PUBLIC_FEATURE_ORDERS":true,"PUBLIC_SAMPLE_RATE":0.25};\n',
    );

    writeFileSync(
      envFile,
      'PUBLIC_API_URL=https://api.acme.test\nPUBLIC_FEATURE_ORDERS=true\nPUBLIC_SAMPLE_RATE=2\n',
    );
    expect(() => validateConfig(args)).toThrow(
      'PUBLIC_SAMPLE_RATE must be less than or equal to 1',
    );
  });

  it('writes a custom runtime global and validates a custom header policy', async () => {
    const directory = temporaryDirectory();
    const output = join(directory, 'config.js');
    const configPath = writeConfig(directory, {
      runtimeConfig: {
        freeze: true,
        globalName: '__ACME_CONFIG__',
        output,
        variables: {
          PUBLIC_API_URL: { required: true, type: 'url' },
          PUBLIC_FEATURE_ORDERS: { default: false, type: 'boolean' },
        },
      },
      securityHeaders: {
        headers: [{ label: 'x-acme-policy', pattern: '^active$' }],
        httpsHeaders: [],
        timeoutMs: 5000,
      },
    });
    vi.stubEnv('PUBLIC_API_URL', 'https://api.acme.test/');
    vi.stubGlobal(
      'fetch',
      vi.fn(
        async () =>
          new Response('', {
            headers: { 'x-acme-policy': 'active' },
            status: 200,
          }),
      ),
    );

    writeRuntimeConfig(parseArgs(['--config', configPath]));
    expect(readFileSync(output, 'utf8')).toBe(
      'window.__ACME_CONFIG__ = Object.freeze({"PUBLIC_API_URL":"https://api.acme.test","PUBLIC_FEATURE_ORDERS":false});\n',
    );
    await expect(
      validateSecurityHeaders(
        parseArgs(['--config', configPath, '--url', 'https://frontend.acme.test']),
      ),
    ).resolves.toBeUndefined();
  });
});
