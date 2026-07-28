import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { option, type ParsedArgs } from '../args.js';

const HTTP_METHODS = new Set(['get', 'put', 'post', 'delete', 'options', 'head', 'patch', 'trace']);

/**
 * Operaciones que el frontend consume. Se declaran como `METODO ruta` y no solo
 * como ruta: comprobar unicamente el path deja pasar que `/products` cambie de
 * `POST` a `PUT`, que es exactamente el tipo de ruptura que este gate existe
 * para detectar.
 */
const defaultRequiredOperations = [
  'POST /ai-chat/messages',
  'POST /auth/google',
  'POST /auth/login',
  'POST /auth/logout',
  'POST /auth/refresh',
  'POST /auth/register',
  'GET /products',
  'POST /products',
  'GET /products/{id}',
  'PATCH /products/{id}',
  'DELETE /products/{id}',
  'POST /uploads/presigned-url',
  'GET /users',
  'POST /users',
  'GET /users/{id}',
  'PATCH /users/{id}',
  'DELETE /users/{id}',
].join(',');

type OpenApiDocument = {
  readonly paths?: Record<string, Record<string, unknown> | undefined>;
  readonly components?: { readonly schemas?: Record<string, unknown> };
};

function parseList(value: string | undefined): string[] {
  return (value ?? '')
    .split(',')
    .map((entry) => entry.trim())
    .filter(Boolean);
}

/** Extrae `METODO ruta` de cada operacion declarada en el documento. */
function documentOperations(document: OpenApiDocument): Set<string> {
  const operations = new Set<string>();

  for (const [path, item] of Object.entries(document.paths ?? {})) {
    for (const method of Object.keys(item ?? {})) {
      if (HTTP_METHODS.has(method.toLowerCase())) {
        operations.add(`${method.toUpperCase()} ${path}`);
      }
    }
  }

  return operations;
}

/**
 * Comprueba que todo `$ref` interno apunte a un schema que existe.
 *
 * Un export truncado o un schema renombrado produce referencias colgantes: el
 * documento sigue siendo JSON valido y el gate de rutas pasa, pero cualquier
 * generador de cliente falla o produce `any`.
 */
function danglingReferences(document: OpenApiDocument): string[] {
  const declared = new Set(Object.keys(document.components?.schemas ?? {}));
  const dangling = new Set<string>();

  const walk = (node: unknown): void => {
    if (Array.isArray(node)) {
      for (const entry of node) walk(entry);
      return;
    }

    if (typeof node !== 'object' || node === null) return;

    for (const [key, value] of Object.entries(node)) {
      if (key === '$ref' && typeof value === 'string') {
        const match = /^#\/components\/schemas\/(.+)$/.exec(value);

        if (!match) {
          dangling.add(value);
        } else if (match[1] && !declared.has(match[1])) {
          dangling.add(value);
        }

        continue;
      }

      walk(value);
    }
  };

  walk(document.paths ?? {});
  walk(document.components?.schemas ?? {});

  return [...dangling].sort();
}

export function validateOpenApi(args: ParsedArgs): void {
  const openApiPath = resolve(
    option(args, 'path') ??
      process.env['BACKEND_OPENAPI_PATH'] ??
      '../bus-impl/docs/openapi/openapi.json',
  );
  if (!existsSync(openApiPath))
    throw new Error(`Backend OpenAPI contract not found: ${openApiPath}`);

  const document = JSON.parse(readFileSync(openApiPath, 'utf8')) as OpenApiDocument;
  const paths = new Set(Object.keys(document.paths ?? {}));
  const operations = documentOperations(document);

  const requiredOperations = parseList(
    option(args, 'required-operations', defaultRequiredOperations),
  );
  const requiredPaths = parseList(option(args, 'required'));
  const forbiddenPrefixes = parseList(option(args, 'forbid-prefix', '/endoso'));

  const missingPaths = requiredPaths.filter((path) => !paths.has(path));
  const missingOperations = requiredOperations.filter((operation) => !operations.has(operation));
  const stalePaths = [...paths].filter((path) =>
    forbiddenPrefixes.some((prefix) => path.startsWith(prefix)),
  );
  const dangling = danglingReferences(document);

  const failures = [
    missingPaths.length > 0 ? `Missing paths: ${missingPaths.join(', ')}` : null,
    missingOperations.length > 0 ? `Missing operations: ${missingOperations.join(', ')}` : null,
    stalePaths.length > 0 ? `Stale paths: ${stalePaths.join(', ')}` : null,
    dangling.length > 0 ? `Dangling schema references: ${dangling.join(', ')}` : null,
  ].filter((failure): failure is string => failure !== null);

  if (failures.length > 0) {
    throw new Error(['Backend OpenAPI compatibility failed.', ...failures].join('\n'));
  }

  console.log(
    `Backend OpenAPI compatibility validated: ${openApiPath} (${operations.size} operations).`,
  );
}
