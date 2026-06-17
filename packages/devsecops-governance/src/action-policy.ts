import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const requiredActions = new Set([
  'setup-node-pnpm',
  'configure-github-packages',
  'validate-stage-source',
  'install-playwright-chromium',
]);

export function validateActions(actionsDir: string): string[] {
  const errors: string[] = [];
  const actionDirectories = readdirSync(actionsDir, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name);

  for (const requiredAction of requiredActions) {
    if (!actionDirectories.includes(requiredAction)) {
      errors.push(`${requiredAction}: required composite action is missing`);
    }
  }

  for (const actionDirectory of actionDirectories) {
    const actionFile = join(actionsDir, actionDirectory, 'action.yml');

    if (!existsSync(actionFile)) {
      errors.push(`${actionDirectory}: action.yml is required`);
      continue;
    }

    const content = readFileSync(actionFile, 'utf8');

    if (!content.includes('runs:')) {
      errors.push(`${actionDirectory}: runs block is required`);
    }

    if (!content.includes('using: composite')) {
      errors.push(`${actionDirectory}: only composite actions are allowed here`);
    }

    if (content.includes('@main') || content.includes('@master') || content.includes('@latest')) {
      errors.push(`${actionDirectory}: floating action refs are not allowed`);
    }
  }

  return errors;
}
