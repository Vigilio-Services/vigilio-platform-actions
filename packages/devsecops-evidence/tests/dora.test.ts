import { describe, expect, it } from 'vitest';
import { calculateDoraMetrics } from '../src/dora.js';

describe('DORA metrics', () => {
  it('calculates deployment metrics without double-counting failure episodes', () => {
    const report = calculateDoraMetrics(
      [
        {
          state: 'success',
          commitAt: '2026-07-01T00:00:00.000Z',
          deployedAt: '2026-07-02T00:00:00.000Z',
          isRework: false,
        },
        {
          state: 'failure',
          commitAt: '2026-07-02T00:00:00.000Z',
          deployedAt: '2026-07-03T00:00:00.000Z',
          isRework: false,
        },
        {
          state: 'error',
          commitAt: '2026-07-02T12:00:00.000Z',
          deployedAt: '2026-07-03T12:00:00.000Z',
          isRework: false,
        },
        {
          state: 'success',
          commitAt: '2026-07-03T00:00:00.000Z',
          deployedAt: '2026-07-04T00:00:00.000Z',
          isRework: false,
        },
        {
          state: 'success',
          commitAt: '2026-07-04T00:00:00.000Z',
          deployedAt: '2026-07-05T00:00:00.000Z',
          isRework: true,
        },
      ],
      { windowDays: 4, generatedAt: new Date('2026-07-06T00:00:00.000Z') },
    );
    expect(report.metrics['deployment_frequency']?.['deployments_per_day']).toBe(0.75);
    expect(report.metrics['change_lead_time']?.['median_hours']).toBe(24);
    expect(report.metrics['failed_deployment_recovery_time']?.['median_hours']).toBe(24);
    expect(report.metrics['change_fail_rate']?.['percent']).toBe(40);
    expect(report.metrics['deployment_rework_rate']?.['percent']).toBe(33.33);
  });
});
