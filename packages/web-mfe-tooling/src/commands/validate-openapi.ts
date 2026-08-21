import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { option, type ParsedArgs } from '../args.js';
import { csvOption, loadConfig } from '../config.js';

type OpenApiDocument = {
  readonly paths?: Readonly<Record<string, unknown>>;
};

export function validateOpenApi(args: ParsedArgs): void {
  const config = loadConfig(args).openApi;
  const environmentPath = process.env['BACKEND_OPENAPI_PATH']?.trim() || undefined;
  const configuredPath = option(args, 'path') ?? environmentPath ?? config?.path;
  if (!configuredPath) {
    throw new Error(
      'OpenAPI path is not configured. Set openApi.path, BACKEND_OPENAPI_PATH, pass --path, or run vigilio-web init.',
    );
  }
  const openApiPath = resolve(configuredPath);
  if (!existsSync(openApiPath)) {
    throw new Error(`Backend OpenAPI contract not found: ${openApiPath}`);
  }

  const document = JSON.parse(readFileSync(openApiPath, 'utf8')) as OpenApiDocument;
  const paths = new Set(Object.keys(document.paths ?? {}));
  const requiredPaths = csvOption(args, 'required', config?.requiredPaths ?? []);
  const forbiddenPrefixes = csvOption(args, 'forbid-prefix', config?.forbiddenPrefixes ?? []);
  const missingPaths = requiredPaths.filter((path) => !paths.has(path));
  const removedPaths = [...paths].filter((path) =>
    forbiddenPrefixes.some((prefix) => path.startsWith(prefix)),
  );

  if (missingPaths.length > 0 || removedPaths.length > 0) {
    throw new Error(
      [
        'Backend OpenAPI compatibility failed.',
        ...(missingPaths.length > 0 ? [`Missing paths: ${missingPaths.join(', ')}`] : []),
        ...(removedPaths.length > 0 ? [`Stale paths: ${removedPaths.join(', ')}`] : []),
      ].join('\n'),
    );
  }
  console.log(`Backend OpenAPI compatibility validated: ${openApiPath}`);
}
