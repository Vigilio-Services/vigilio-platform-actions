import { readFileSync } from 'node:fs';
import path from 'node:path';

interface ProjectPackage {
  readonly name: string;
}

export const projectRoot = path.resolve(process.env['VIGILIO_PROJECT_ROOT'] ?? process.cwd());

export function readProjectPackage(): ProjectPackage {
  const packageFile = path.join(projectRoot, 'package.json');
  const metadata: unknown = JSON.parse(readFileSync(packageFile, 'utf8'));
  if (typeof metadata !== 'object' || metadata === null) {
    throw new Error(`Invalid package metadata: ${packageFile}`);
  }
  if (!('name' in metadata) || typeof metadata.name !== 'string' || !metadata.name) {
    throw new Error(`Invalid package name: ${packageFile}`);
  }
  return { name: metadata.name };
}

export function projectSlug(): string {
  const packageName = String(readProjectPackage().name ?? 'vigilio-app');
  const unscopedName = packageName.includes('/') ? packageName.split('/').at(-1) : packageName;
  const slug = String(process.env['VIGILIO_PROJECT_SLUG'] ?? unscopedName)
    .toLowerCase()
    .replaceAll(/[^a-z0-9]+/g, '_')
    .replaceAll(/^_+|_+$/g, '');

  if (!slug) {
    throw new Error('Unable to infer VIGILIO_PROJECT_SLUG from package.json');
  }
  return slug.slice(0, 40);
}

export function projectDatabaseName(suffix = ''): string {
  return `${projectSlug()}${suffix}`.slice(0, 63);
}

export function localPostgresUrl(database: string, environmentPrefix: string): string {
  const host = process.env[`${environmentPrefix}_HOST`] ?? '127.0.0.1';
  const port = Number(process.env[`${environmentPrefix}_PORT`] ?? 5432);
  const username = process.env[`${environmentPrefix}_USER`] ?? 'postgres';
  const password = process.env[`${environmentPrefix}_PASSWORD`] ?? 'postgres';

  if (!host || !Number.isInteger(port) || port < 1 || port > 65_535) {
    throw new Error(`Invalid ${environmentPrefix}_HOST or ${environmentPrefix}_PORT`);
  }

  const url = new URL(`postgres://${host}:${port}`);
  url.username = username;
  url.password = password;
  url.pathname = database;
  return url.toString();
}

export function assertSafeDatabaseName(database: string, allowedSuffixes: readonly string[]): void {
  const validName = /^[a-z][a-z0-9_]{2,62}$/.test(database);
  const validSuffix = allowedSuffixes.some((suffix) => database.endsWith(suffix));
  if (!validName || !validSuffix) {
    throw new Error(
      `Unsafe database name: ${database}. Expected suffix: ${allowedSuffixes.join(' or ')}`,
    );
  }
}
