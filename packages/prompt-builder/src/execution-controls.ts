const DOCUMENTATION_ONLY_PREFIXES = ['docs/', 'openspec/', 'generated/', '.prompt-builder-backup/'];

export function hasImplementationPath(paths: string[]) {
  return paths.some((value) => {
    const normalized = (value.includes(':') ? value.slice(value.indexOf(':') + 1) : value)
      .trim()
      .replaceAll('\\', '/')
      .replace(/^\.\//, '');
    return !DOCUMENTATION_ONLY_PREFIXES.some(
      (prefix) => normalized === prefix.slice(0, -1) || normalized.startsWith(prefix),
    );
  });
}

export function assertPreparedExecutionControls(input: {
  packId: string;
  allowedPaths: string[];
  qualityGates: string[];
  activationGates: string[];
}) {
  if (!hasImplementationPath(input.allowedPaths)) {
    throw new Error(
      `EXECUTION_SCOPE_MISSING: ${input.packId} has no allowed implementation path outside documentation/derived areas`,
    );
  }
  if (input.qualityGates.length + input.activationGates.length === 0) {
    throw new Error(
      `QUALITY_CONTROLS_MISSING: ${input.packId} declares no executable quality gates`,
    );
  }
}
