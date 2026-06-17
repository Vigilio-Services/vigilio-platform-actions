export class GovernanceError extends Error {
  constructor(readonly errors: string[]) {
    super(errors.join('\n'));
    this.name = 'GovernanceError';
  }
}

export function assertNoErrors(errors: string[]): void {
  if (errors.length > 0) {
    throw new GovernanceError(errors);
  }
}
