import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { parseArgs } from '../src/args.js';
import { validateOpenApi } from '../src/commands/validate-openapi.js';

/**
 * Este comando es un gate de CI: lo que importa no es que acepte un documento
 * bueno, sino que **rechace** los malos. Cada caso de fallo corresponde a una
 * forma real de romper el contrato entre `bus-impl` y `web-mfe`.
 */
describe('validateOpenApi', () => {
  let root: string;

  beforeEach(() => {
    root = mkdtempSync(join(tmpdir(), 'vigilio-openapi-'));
  });

  afterEach(() => {
    rmSync(root, { recursive: true, force: true });
  });

  function writeDocument(document: unknown): string {
    const path = join(root, 'openapi.json');
    writeFileSync(path, JSON.stringify(document));
    return path;
  }

  const minimalDocument = {
    openapi: '3.1.0',
    paths: {
      '/products': {
        get: { responses: { '200': { description: 'ok' } } },
        post: { responses: { '201': { description: 'created' } } },
      },
    },
    components: { schemas: {} },
  };

  it('acepta un documento que cumple las operaciones requeridas', () => {
    const path = writeDocument(minimalDocument);

    expect(() =>
      validateOpenApi(
        parseArgs(['--path', path, '--required-operations', 'GET /products,POST /products']),
      ),
    ).not.toThrow();
  });

  it('falla si el archivo no existe', () => {
    expect(() => validateOpenApi(parseArgs(['--path', join(root, 'no-existe.json')]))).toThrow(
      /not found/,
    );
  });

  it('detecta una ruta requerida ausente', () => {
    const path = writeDocument(minimalDocument);

    expect(() => validateOpenApi(parseArgs(['--path', path, '--required', '/users']))).toThrow(
      /Missing paths: \/users/,
    );
  });

  /**
   * El caso que el gate anterior no cubria: la ruta sigue existiendo, pero el
   * metodo cambio. Comparar solo nombres de ruta lo dejaba pasar.
   */
  it('detecta que una operacion cambio de metodo aunque la ruta siga existiendo', () => {
    const path = writeDocument({
      ...minimalDocument,
      paths: {
        '/products': {
          get: { responses: { '200': { description: 'ok' } } },
          put: { responses: { '200': { description: 'ok' } } },
        },
      },
    });

    expect(() =>
      validateOpenApi(
        parseArgs(['--path', path, '--required-operations', 'GET /products,POST /products']),
      ),
    ).toThrow(/Missing operations: POST \/products/);
  });

  it('rechaza rutas con un prefijo prohibido', () => {
    const path = writeDocument({
      ...minimalDocument,
      paths: {
        ...minimalDocument.paths,
        '/endoso/{id}': { get: { responses: { '200': { description: 'ok' } } } },
      },
    });

    expect(() =>
      validateOpenApi(
        parseArgs([
          '--path',
          path,
          '--required-operations',
          'GET /products',
          '--forbid-prefix',
          '/endoso',
        ]),
      ),
    ).toThrow(/Stale paths: \/endoso\/\{id\}/);
  });

  it('detecta referencias a schemas que no existen', () => {
    const path = writeDocument({
      openapi: '3.1.0',
      paths: {
        '/products': {
          get: {
            responses: {
              '200': {
                content: {
                  'application/json': {
                    schema: { $ref: '#/components/schemas/ProductoQueNoExiste' },
                  },
                },
              },
            },
          },
        },
      },
      components: { schemas: { OtroSchema: { type: 'object' } } },
    });

    expect(() =>
      validateOpenApi(parseArgs(['--path', path, '--required-operations', 'GET /products'])),
    ).toThrow(/Dangling schema references: #\/components\/schemas\/ProductoQueNoExiste/);
  });

  it('acepta referencias que si resuelven', () => {
    const path = writeDocument({
      openapi: '3.1.0',
      paths: {
        '/products': {
          get: {
            responses: {
              '200': {
                content: {
                  'application/json': {
                    schema: { $ref: '#/components/schemas/Product' },
                  },
                },
              },
            },
          },
        },
      },
      components: { schemas: { Product: { type: 'object' } } },
    });

    expect(() =>
      validateOpenApi(parseArgs(['--path', path, '--required-operations', 'GET /products'])),
    ).not.toThrow();
  });

  it('acumula todos los fallos en un solo error en vez de parar en el primero', () => {
    const path = writeDocument({
      openapi: '3.1.0',
      paths: {
        '/endoso': { get: { responses: { '200': { description: 'ok' } } } },
      },
      components: { schemas: {} },
    });

    try {
      validateOpenApi(
        parseArgs([
          '--path',
          path,
          '--required',
          '/products',
          '--required-operations',
          'POST /products',
          '--forbid-prefix',
          '/endoso',
        ]),
      );
      expect.unreachable('deberia haber fallado');
    } catch (error) {
      const message = (error as Error).message;
      expect(message).toContain('Missing paths');
      expect(message).toContain('Missing operations');
      expect(message).toContain('Stale paths');
    }
  });

  it('ignora claves que no son metodos HTTP al enumerar operaciones', () => {
    const path = writeDocument({
      openapi: '3.1.0',
      paths: {
        '/products': {
          get: { responses: { '200': { description: 'ok' } } },
          parameters: [{ name: 'limit', in: 'query' }],
          summary: 'Catalogo',
        },
      },
      components: { schemas: {} },
    });

    expect(() =>
      validateOpenApi(parseArgs(['--path', path, '--required-operations', 'GET /products'])),
    ).not.toThrow();
  });
});
