import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const forbiddenRefs = ['@main', '@master', '@HEAD', '@latest'];
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

function workflowFiles(workflowsDir: string): string[] {
  return readdirSync(workflowsDir).filter(
    (file) => file.endsWith('.yml') || file.endsWith('.yaml'),
  );
}

export function validateWorkflows(workflowsDir: string): string[] {
  const errors: string[] = [];
  const files = workflowFiles(workflowsDir);

  for (const workflow of requiredReusableWorkflows) {
    if (!files.includes(workflow)) {
      errors.push(`${workflow}: required reusable workflow is missing`);
    }
  }

  for (const file of files) {
    const content = readFileSync(join(workflowsDir, file), 'utf8');

    for (const forbiddenRef of forbiddenRefs) {
      if (content.includes(forbiddenRef)) {
        errors.push(`${file}: floating ref is not allowed: ${forbiddenRef}`);
      }
    }

    if (content.includes('pull_request_target:')) {
      errors.push(`${file}: pull_request_target is not allowed`);
    }

    if (!content.includes('permissions:')) {
      errors.push(`${file}: explicit permissions are required`);
    }

    if (!content.includes('timeout-minutes:')) {
      errors.push(`${file}: timeout-minutes is required`);
    }

    if (content.includes('actions/checkout@') && !content.includes('persist-credentials: false')) {
      errors.push(`${file}: checkout must use persist-credentials: false`);
    }

    if (
      content.match(/id-token:\s*write/) &&
      !content.includes('actions/attest@') &&
      !content.includes('configure-aws-credentials@')
    ) {
      errors.push(`${file}: id-token: write must be used only for cloud OIDC or attestations`);
    }

    if (requiredReusableWorkflows.has(file) && !content.includes('workflow_call:')) {
      errors.push(`${file}: reusable workflow must expose workflow_call`);
    }
  }

  return errors;
}
