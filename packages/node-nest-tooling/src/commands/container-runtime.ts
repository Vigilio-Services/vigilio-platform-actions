import { spawnSync } from 'node:child_process';

export function resolveContainerCli(): string | undefined {
  const explicit = process.env['E2E_CONTAINER_CLI'];
  if (explicit) {
    if (!runtimeReady(explicit)) {
      throw new Error(`Configured container runtime is not ready: ${explicit}`);
    }
    return explicit;
  }

  for (const candidate of ['podman', 'docker']) {
    if (runtimeReady(candidate)) return candidate;
    if (
      candidate === 'podman' &&
      commandAvailable(candidate) &&
      process.env['E2E_AUTO_START_CONTAINER_ENGINE'] !== 'false'
    ) {
      startPodmanMachine();
      if (runtimeReady(candidate)) return candidate;
    }
  }
  return undefined;
}

function commandAvailable(command: string): boolean {
  return (
    spawnSync(command, ['--version'], {
      encoding: 'utf8',
      stdio: 'pipe',
      timeout: 10_000,
    }).status === 0
  );
}

function runtimeReady(command: string): boolean {
  if (!commandAvailable(command)) return false;
  return (
    spawnSync(command, ['info'], {
      encoding: 'utf8',
      stdio: 'pipe',
      timeout: 30_000,
    }).status === 0
  );
}

function startPodmanMachine(): void {
  const result = spawnSync('podman', ['machine', 'start'], {
    encoding: 'utf8',
    stdio: 'pipe',
    timeout: 120_000,
  });
  if (result.status !== 0) {
    const details = [result.stdout, result.stderr].filter(Boolean).join('\n').trim();
    console.warn(`Podman machine did not start${details ? `:\n${details}` : ''}`);
  }
}
