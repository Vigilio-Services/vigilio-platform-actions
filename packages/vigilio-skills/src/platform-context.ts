import { lstat, readFile, realpath } from 'node:fs/promises';
import path from 'node:path';
import { Ajv2020, type ErrorObject } from 'ajv/dist/2020.js';
import { parse } from 'yaml';

export const platformContextRelativePath = '.vigilio/platform-context.yaml';

export interface PlatformContext {
  schemaVersion: 1;
  project: {
    name: string;
    type: 'application' | 'platform' | 'library' | 'monorepo';
  };
  repositories: {
    application: string;
    infrastructure: string;
    gitops: string;
    images: string;
  };
  environments: Array<'local' | 'development' | 'testing' | 'staging' | 'production'>;
  delivery?: {
    provider: 'github' | 'gitlab' | 'bitbucket' | 'other';
    gitopsEngine: 'argocd' | 'flux' | 'none';
    containerRegistry: string;
  };
  infrastructure?: {
    provider: 'onprem' | 'aws' | 'azure' | 'gcp' | 'hybrid' | 'none';
    kubernetesDistribution?: string;
  };
  labs?: {
    standard?: string;
    runtimeSecurity?: string;
  };
}

export type PlatformContextResult =
  | {
      status: 'PASS';
      source: 'explicit';
      file: string;
      context: PlatformContext;
    }
  | {
      status: 'NOT_RUN';
      source: 'missing';
      file: string;
      reason: string;
    };

export class PlatformContextValidationError extends Error {
  readonly file: string;
  readonly validationErrors: readonly ErrorObject[];

  constructor(file: string, message: string, validationErrors: readonly ErrorObject[] = []) {
    super(message);
    this.name = 'PlatformContextValidationError';
    this.file = file;
    this.validationErrors = validationErrors;
  }
}

export async function validatePlatformContext(
  consumerRoot: string,
  schemaFile: string,
): Promise<PlatformContextResult> {
  const root = path.resolve(consumerRoot);
  const file = path.join(root, platformContextRelativePath);

  let metadata: Awaited<ReturnType<typeof lstat>>;
  try {
    metadata = await lstat(file);
  } catch (error) {
    if (isNodeError(error) && error.code === 'ENOENT') {
      return {
        status: 'NOT_RUN',
        source: 'missing',
        file,
        reason: `${platformContextRelativePath} is optional and was not found`,
      };
    }
    throw error;
  }

  if (!metadata.isFile() || metadata.isSymbolicLink()) {
    throw new PlatformContextValidationError(file, 'Platform context must be a regular file');
  }

  const resolvedFile = await realpath(file);
  const relative = path.relative(root, resolvedFile);
  if (relative.startsWith('..') || path.isAbsolute(relative)) {
    throw new PlatformContextValidationError(file, 'Platform context escapes the consumer root');
  }

  let document: unknown;
  try {
    document = parse(await readFile(resolvedFile, 'utf8'), { strict: true, uniqueKeys: true });
  } catch (error) {
    throw new PlatformContextValidationError(
      file,
      `Invalid YAML: ${error instanceof Error ? error.message : String(error)}`,
    );
  }

  let schema: object;
  try {
    schema = JSON.parse(await readFile(schemaFile, 'utf8')) as object;
  } catch (error) {
    throw new PlatformContextValidationError(
      file,
      `Platform context schema cannot be loaded: ${error instanceof Error ? error.message : String(error)}`,
    );
  }

  const ajv = new Ajv2020({ allErrors: true, strict: true });
  const validate = ajv.compile<PlatformContext>(schema);
  if (!validate(document)) {
    const validationErrors = validate.errors ?? [];
    const details = validationErrors
      .map((error) => `${error.instancePath || '/'} ${error.message ?? 'is invalid'}`)
      .join('; ');
    throw new PlatformContextValidationError(
      file,
      `Invalid ${platformContextRelativePath}: ${details}`,
      validationErrors,
    );
  }

  return { status: 'PASS', source: 'explicit', file: resolvedFile, context: document };
}

function isNodeError(error: unknown): error is NodeJS.ErrnoException {
  return error instanceof Error && 'code' in error;
}
