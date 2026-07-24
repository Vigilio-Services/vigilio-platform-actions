import { describe, expect, it } from 'vitest';
import { validatePrRiskBody } from '../src/pr-policy.js';

const completeBody = `
## Descripcion
Actualiza el pipeline y mantiene compatibilidad con los consumidores existentes.

## Pruebas y evidencia
Ejecute pnpm lint, typecheck y todas las pruebas unitarias.

## Riesgo y rollback
Riesgo bajo. Rollback mediante la version anterior del paquete.

## Seguridad
No cambia IAM ni manejo de secretos.
`;

describe('PR risk policy', () => {
  it('accepts explicit test, risk, rollback, and security evidence', () => {
    expect(validatePrRiskBody(completeBody)).toEqual([]);
  });

  it('rejects an untouched template', () => {
    const errors = validatePrRiskBody(`
## Descripcion
Agrega una descripcion clara de que cambia y por que cambia.
## Pruebas y evidencia
Describe las pruebas ejecutadas y pega evidencia relevante.
## Riesgo y rollback
Describe el riesgo principal, plan de rollback o por que no aplica.
## Seguridad
Describe impacto de seguridad o por que no aplica.
`);
    expect(errors).toContain('PR body must describe test evidence.');
    expect(errors).toContain('PR body must describe risk and rollback.');
    expect(errors).toContain('PR body must describe security impact.');
  });
});
