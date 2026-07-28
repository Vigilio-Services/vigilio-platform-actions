import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { parseArgs } from '../src/args.js';
import { validateOpenApi } from '../src/commands/validate-openapi.js';

/**
 * Contrato real de `bus-impl`, no un fixture.
 *
 * Es la unica prueba que verifica que los defaults del gate coinciden con lo
 * que el backend publica de verdad. Un fixture sintetico siempre pasa; este
 * test falla si alguien cambia los defaults sin mirar el OpenAPI, o si el
 * backend rompe una operacion que el frontend consume.
 */
const contractPath = resolve(import.meta.dirname, '../../../../bus-impl/docs/openapi/openapi.json');

describe.skipIf(!existsSync(contractPath))('contrato real de bus-impl', () => {
  it('el OpenAPI publicado satisface los defaults del gate', () => {
    expect(() => validateOpenApi(parseArgs(['--path', contractPath]))).not.toThrow();
  });
});
