const failureStates = new Set(['error', 'failure']);

export interface DeploymentRecord {
  readonly commitAt: string;
  readonly deployedAt: string;
  readonly isRework: boolean;
  readonly state: string;
}

export interface DoraReport {
  readonly data_quality: {
    readonly failed_deployments: number;
    readonly rework_detection: string;
    readonly source: string;
    readonly successful_deployments: number;
    readonly terminal_deployments: number;
    readonly unresolved_failure_episode: boolean;
  };
  readonly generated_at: string;
  readonly metrics: Readonly<Record<string, Readonly<Record<string, number | null>>>>;
  readonly schema_version: 1;
  readonly window_days: number;
}

export function calculateDoraMetrics(
  records: readonly DeploymentRecord[],
  options: { readonly generatedAt?: Date; readonly windowDays: number },
): DoraReport {
  const terminal = records
    .filter((record) => record.state === 'success' || failureStates.has(record.state))
    .toSorted((left, right) => Date.parse(left.deployedAt) - Date.parse(right.deployedAt));
  const successful = terminal.filter((record) => record.state === 'success');
  const failed = terminal.filter((record) => failureStates.has(record.state));
  const leadTimes = successful
    .map((record) => hoursBetween(record.commitAt, record.deployedAt))
    .filter((value) => value >= 0 && Number.isFinite(value));

  const recoveryTimes: number[] = [];
  let failureStartedAt: string | undefined;
  for (const record of terminal) {
    if (failureStates.has(record.state) && !failureStartedAt) {
      failureStartedAt = record.deployedAt;
    } else if (record.state === 'success' && failureStartedAt) {
      recoveryTimes.push(hoursBetween(failureStartedAt, record.deployedAt));
      failureStartedAt = undefined;
    }
  }

  const terminalCount = terminal.length;
  const reworkCount = successful.filter((record) => record.isRework).length;
  return {
    schema_version: 1,
    generated_at: (options.generatedAt ?? new Date()).toISOString(),
    window_days: options.windowDays,
    data_quality: {
      source: 'github-deployments',
      terminal_deployments: terminalCount,
      successful_deployments: successful.length,
      failed_deployments: failed.length,
      unresolved_failure_episode: Boolean(failureStartedAt),
      rework_detection: 'commit-message-proxy: hotfix|revert|rollback',
    },
    metrics: {
      deployment_frequency: {
        successful_deployments: successful.length,
        deployments_per_day: round(successful.length / options.windowDays, 3),
      },
      change_lead_time: {
        median_hours: round(median(leadTimes)),
        sample_size: leadTimes.length,
      },
      failed_deployment_recovery_time: {
        median_hours: round(median(recoveryTimes)),
        sample_size: recoveryTimes.length,
      },
      change_fail_rate: {
        percent: terminalCount === 0 ? null : round((failed.length / terminalCount) * 100),
        failed_deployments: failed.length,
        sample_size: terminalCount,
      },
      deployment_rework_rate: {
        percent: successful.length === 0 ? null : round((reworkCount / successful.length) * 100),
        rework_deployments: reworkCount,
        sample_size: successful.length,
      },
    },
  };
}

export function renderDoraMarkdown(report: DoraReport): string {
  const metric = report.metrics;
  const value = (input: number | null, suffix = ''): string =>
    input === null ? 'N/A' : `${input}${suffix}`;
  return [
    '# DORA deployment metrics',
    '',
    `Window: ${report.window_days} days`,
    `Generated: ${report.generated_at}`,
    '',
    '| Metric | Value | Sample |',
    '| --- | ---: | ---: |',
    `| Deployment frequency | ${metric['deployment_frequency']?.['successful_deployments']} successful (${metric['deployment_frequency']?.['deployments_per_day']}/day) | ${report.data_quality.terminal_deployments} |`,
    `| Change lead time | ${value(metric['change_lead_time']?.['median_hours'] ?? null, ' h')} | ${metric['change_lead_time']?.['sample_size']} |`,
    `| Failed deployment recovery time | ${value(metric['failed_deployment_recovery_time']?.['median_hours'] ?? null, ' h')} | ${metric['failed_deployment_recovery_time']?.['sample_size']} |`,
    `| Change fail rate | ${value(metric['change_fail_rate']?.['percent'] ?? null, '%')} | ${metric['change_fail_rate']?.['sample_size']} |`,
    `| Deployment rework rate | ${value(metric['deployment_rework_rate']?.['percent'] ?? null, '%')} | ${metric['deployment_rework_rate']?.['sample_size']} |`,
    '',
  ].join('\n');
}

function round(value: number | null, decimals = 2): number | null {
  if (value === null || !Number.isFinite(value)) return null;
  const factor = 10 ** decimals;
  return Math.round(value * factor) / factor;
}

function median(values: readonly number[]): number | null {
  if (values.length === 0) return null;
  const sorted = values.toSorted((left, right) => left - right);
  const middle = Math.floor(sorted.length / 2);
  const current = sorted[middle];
  if (current === undefined) return null;
  if (sorted.length % 2 === 1) return current;
  const previous = sorted[middle - 1];
  return previous === undefined ? current : (previous + current) / 2;
}

function hoursBetween(start: string, end: string): number {
  return (Date.parse(end) - Date.parse(start)) / 3_600_000;
}
