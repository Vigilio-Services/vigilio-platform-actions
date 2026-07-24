const maximumValidityDays = {
  critical: 30,
  high: 30,
  medium: 90,
  low: 90,
} as const;

type Severity = keyof typeof maximumValidityDays;

export function validateSecurityExceptions(document: unknown, now = new Date()): string[] {
  if (!isRecord(document) || document['schema_version'] !== 1) {
    return ['security exceptions must use schema_version 1 and an exceptions array'];
  }

  const exceptions = document['exceptions'];
  if (!Array.isArray(exceptions)) {
    return ['security exceptions must use schema_version 1 and an exceptions array'];
  }

  const errors: string[] = [];
  const ids = new Set<string>();
  for (const [index, value] of exceptions.entries()) {
    const exception = isRecord(value) ? value : {};
    const id = readRequiredString(exception, 'id');
    const label = id || `exceptions[${index}]`;

    for (const field of [
      'id',
      'issue',
      'severity',
      'component',
      'owner',
      'justification',
      'created_at',
      'expires_at',
    ]) {
      if (!readRequiredString(exception, field)) {
        errors.push(`${label}: ${field} is required`);
      }
    }

    if (id && ids.has(id)) {
      errors.push(`${label}: duplicate id`);
    }
    if (id) ids.add(id);

    const severity = readRequiredString(exception, 'severity').toLowerCase();
    if (!isSeverity(severity)) {
      errors.push(`${label}: severity must be critical, high, medium, or low`);
    }

    const approvers = exception['approvers'];
    if (!Array.isArray(approvers) || approvers.length < 2) {
      errors.push(`${label}: at least two approvers are required`);
    }

    const compensatingControls = exception['compensating_controls'];
    if (!Array.isArray(compensatingControls) || compensatingControls.length === 0) {
      errors.push(`${label}: at least one compensating control is required`);
    }

    const createdAt = new Date(readRequiredString(exception, 'created_at'));
    const expiresAt = new Date(readRequiredString(exception, 'expires_at'));
    if (Number.isNaN(createdAt.getTime()) || Number.isNaN(expiresAt.getTime())) {
      errors.push(`${label}: created_at and expires_at must be valid ISO dates`);
      continue;
    }
    if (expiresAt <= now) {
      errors.push(`${label}: exception expired at ${readRequiredString(exception, 'expires_at')}`);
    }
    if (isSeverity(severity) && daysBetween(createdAt, expiresAt) > maximumValidityDays[severity]) {
      errors.push(
        `${label}: validity exceeds ${maximumValidityDays[severity]} days for ${severity}`,
      );
    }
  }

  return errors;
}

function daysBetween(start: Date, end: Date): number {
  return (end.getTime() - start.getTime()) / 86_400_000;
}

function readRequiredString(record: Record<string, unknown>, key: string): string {
  const value = record[key];
  return typeof value === 'string' ? value.trim() : '';
}

function isSeverity(value: string): value is Severity {
  return value in maximumValidityDays;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
