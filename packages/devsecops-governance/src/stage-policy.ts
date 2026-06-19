export type Stage = 'development' | 'test' | 'staging' | 'preproduction' | 'production';

export interface StageSourceInput {
  readonly stage: Stage;
  readonly refName: string;
  readonly allowReleaseForStaging?: boolean;
}

export function isValidStageSource({ refName }: StageSourceInput): boolean {
  return refName === 'main';
}

export function validateStageSource(input: StageSourceInput): string[] {
  if (isValidStageSource(input)) {
    return [];
  }

  return [`${input.stage} must run from main in trunk-based mode.`];
}
