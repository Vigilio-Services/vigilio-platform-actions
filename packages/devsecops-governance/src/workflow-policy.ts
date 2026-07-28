import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import {
  activeYaml,
  validateCheckoutCredentials,
  validateNoDuplicateKeys,
  validatePinnedUses,
} from './yaml-policy.js';

const requiredReusableWorkflows = new Set([
  'shared-backend-node-nest-ci.yml',
  'shared-backend-node-nest-deploy-cdk.yml',
  'shared-web-mfe-preact-ci.yml',
  'shared-web-mfe-deploy-s3-cloudfront.yml',
  'shared-mobile-expo-ci.yml',
  'shared-mobile-expo-eas-build.yml',
  'shared-desktop-tauri-ci.yml',
  'shared-desktop-tauri-build.yml',
]);

export type WorkflowProfile = 'consumer' | 'platform';

export interface WorkflowPolicyOptions {
  readonly profile?: WorkflowProfile;
}

function workflowFiles(workflowsDir: string): string[] {
  return readdirSync(workflowsDir).filter(
    (file) => file.endsWith('.yml') || file.endsWith('.yaml'),
  );
}

export function validateWorkflows(
  workflowsDir: string,
  options: WorkflowPolicyOptions = { profile: 'platform' },
): string[] {
  const errors: string[] = [];
  const files = workflowFiles(workflowsDir);
  const profile = options.profile ?? 'platform';

  if (profile === 'platform') {
    for (const workflow of requiredReusableWorkflows) {
      if (!files.includes(workflow)) {
        errors.push(`${workflow}: required reusable workflow is missing`);
      }
    }
  }

  for (const file of files) {
    const rawContent = readFileSync(join(workflowsDir, file), 'utf8');
    const content = activeYaml(rawContent);

    errors.push(...validatePinnedUses(rawContent, file));
    errors.push(...validateCheckoutCredentials(rawContent, file));
    errors.push(...validateNoDuplicateKeys(rawContent, file));

    if (content.includes('pull_request_target:')) {
      errors.push(`${file}: pull_request_target is not allowed`);
    }

    if (!content.includes('permissions:')) {
      errors.push(`${file}: explicit permissions are required`);
    }

    const hasRunnerJob = /^\s{4}runs-on:/m.test(content);
    if (hasRunnerJob && !content.includes('timeout-minutes:')) {
      errors.push(`${file}: timeout-minutes is required`);
    }

    if (content.match(/id-token:\s*write/) && !usesOidcCapability(content, workflowsDir)) {
      errors.push(`${file}: id-token: write must be used only for cloud OIDC or attestations`);
    }

    if (
      profile === 'platform' &&
      requiredReusableWorkflows.has(file) &&
      !content.includes('workflow_call:')
    ) {
      errors.push(`${file}: reusable workflow must expose workflow_call`);
    }
  }

  return errors;
}

/**
 * Acciones que legitiman `id-token: write`.
 *
 * `actions/deploy-pages` usa OIDC para autenticarse contra GitHub Pages, igual
 * que `configure-aws-credentials` contra AWS. Sin esta entrada, cualquier repo
 * de documentacion publicado en Pages daria un falso positivo y el equipo
 * terminaria ignorando el gate.
 */
const oidcCapableActions = [
  'actions/attest@',
  'configure-aws-credentials@',
  'actions/deploy-pages@',
];

function usesOidcCapability(content: string, workflowsDir: string): boolean {
  if (oidcCapableActions.some((action) => content.includes(action))) {
    return true;
  }

  for (const match of content.matchAll(/\buses:\s*\.\/\.github\/workflows\/([^\s#]+)/g)) {
    const referencedFile = match[1];
    if (!referencedFile) {
      continue;
    }

    try {
      const referencedContent = activeYaml(
        readFileSync(join(workflowsDir, referencedFile), 'utf8'),
      );
      if (oidcCapableActions.some((action) => referencedContent.includes(action))) {
        return true;
      }
    } catch {
      return false;
    }
  }

  return false;
}
