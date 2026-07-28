import { existsSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { option, type ParsedArgs } from '../args.js';

type SizedFile = { readonly path: string; readonly size: number };

function walk(directory: string): SizedFile[] {
  return readdirSync(directory).flatMap((entry) => {
    const path = join(directory, entry);
    const stat = statSync(path);
    return stat.isDirectory() ? walk(path) : [{ path, size: stat.size }];
  });
}

export function validateBundleBudget(args: ParsedArgs): void {
  const distDir = option(args, 'dist', 'dist') ?? 'dist';
  const maxJs = Number(option(args, 'max-js', String(250 * 1024)));
  const maxCss = Number(option(args, 'max-css', String(80 * 1024)));
  if (!existsSync(distDir))
    throw new Error(`${distDir} directory does not exist. Run pnpm build first.`);
  if (!Number.isFinite(maxJs) || !Number.isFinite(maxCss))
    throw new Error('Bundle budgets must be numbers.');

  const files = walk(distDir);
  const totalJs = files
    .filter(({ path }) => path.endsWith('.js'))
    .reduce((sum, file) => sum + file.size, 0);
  const totalCss = files
    .filter(({ path }) => path.endsWith('.css'))
    .reduce((sum, file) => sum + file.size, 0);
  const errors = [
    ...(totalJs > maxJs ? [`JS budget exceeded: ${totalJs} bytes > ${maxJs} bytes`] : []),
    ...(totalCss > maxCss ? [`CSS budget exceeded: ${totalCss} bytes > ${maxCss} bytes`] : []),
  ];
  if (errors.length > 0)
    throw new Error(['Bundle budget failed:', ...errors.map((error) => `- ${error}`)].join('\n'));
  console.log(`Bundle budget validated. JS=${totalJs} bytes CSS=${totalCss} bytes`);
}
