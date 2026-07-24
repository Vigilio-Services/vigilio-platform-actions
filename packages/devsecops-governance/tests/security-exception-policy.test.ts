import { describe, expect, it } from 'vitest';
import { validateSecurityExceptions } from '../src/security-exception-policy.js';

function exception(overrides: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    id: 'SEC-EX-001',
    issue: 'SEC-123',
    severity: 'high',
    component: 'authentication',
    owner: 'backend-team',
    approvers: ['security-team', 'platform-team'],
    justification: 'Upstream remediation is not available.',
    compensating_controls: ['Endpoint disabled for untrusted callers.'],
    created_at: '2026-07-01T00:00:00.000Z',
    expires_at: '2026-07-20T00:00:00.000Z',
    ...overrides,
  };
}

describe('security exception policy', () => {
  it('accepts a complete non-expired exception', () => {
    expect(
      validateSecurityExceptions(
        { schema_version: 1, exceptions: [exception()] },
        new Date('2026-07-10T00:00:00.000Z'),
      ),
    ).toEqual([]);
  });

  it('rejects expired and overlong exceptions', () => {
    const errors = validateSecurityExceptions(
      {
        schema_version: 1,
        exceptions: [
          exception({ expires_at: '2026-09-15T00:00:00.000Z' }),
          exception({
            id: 'SEC-EX-002',
            created_at: '2026-06-01T00:00:00.000Z',
            expires_at: '2026-07-01T00:00:00.000Z',
          }),
        ],
      },
      new Date('2026-07-10T00:00:00.000Z'),
    );
    expect(errors.some((error) => error.includes('exceeds 30 days'))).toBe(true);
    expect(errors.some((error) => error.includes('expired'))).toBe(true);
  });
});
