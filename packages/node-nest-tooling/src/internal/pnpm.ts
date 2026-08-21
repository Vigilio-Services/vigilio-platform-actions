import path from 'node:path';

export interface PnpmCommand {
  readonly args: readonly string[];
  readonly executable: string;
}

/**
 * Runs the project-selected pnpm through the Corepack shipped with Node 24.
 * This avoids PATH lookup and cmd.exe, while packageManager remains the
 * consumer-owned source of truth for the pnpm version.
 */
export function pnpmCommand(args: readonly string[]): PnpmCommand {
  const nodeDirectory = path.dirname(process.execPath);
  const corepackPnpm =
    process.platform === 'win32'
      ? path.join(nodeDirectory, 'node_modules', 'corepack', 'dist', 'pnpm.js')
      : path.resolve(nodeDirectory, '..', 'lib', 'node_modules', 'corepack', 'dist', 'pnpm.js');

  return {
    executable: process.execPath,
    args: [corepackPnpm, ...args],
  };
}
