const releaseRegex = /^release\/[0-9]+(\.[0-9]+){1,2}$/;

export type Stage = 'development' | 'test' | 'staging' | 'preproduction' | 'production';

export interface StageSourceInput {
  readonly stage: Stage;
  readonly refName: string;
  readonly allowReleaseForStaging?: boolean;
}

export function isValidStageSource({
  stage,
  refName,
  allowReleaseForStaging = false,
}: StageSourceInput): boolean {
  if (stage === 'development') {
    return refName === 'develop';
  }

  if (stage === 'test') {
    return releaseRegex.test(refName);
  }

  if (stage === 'staging') {
    return refName === 'main' || (allowReleaseForStaging && releaseRegex.test(refName));
  }

  return refName === 'main';
}

export function validateStageSource(input: StageSourceInput): string[] {
  if (isValidStageSource(input)) {
    return [];
  }

  if (input.stage === 'development') {
    return ['development must run from develop.'];
  }

  if (input.stage === 'test') {
    return ['test must run from release/x.y.z.'];
  }

  if (input.stage === 'staging') {
    return [
      input.allowReleaseForStaging
        ? 'staging must run from main or release/x.y.z.'
        : 'staging must run from main.',
    ];
  }

  return [`${input.stage} must run from main.`];
}
