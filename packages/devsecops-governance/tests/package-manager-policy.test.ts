import { mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { validatePackageManagerPolicy } from '../src/package-manager-policy.js';

const workspacePolicy = `packages:
  - .
nodeVersion: 24.16.0
engineStrict: true
preferFrozenLockfile: true
verifyStoreIntegrity: true
strictStorePkgContentCheck: true
verifyDepsBeforeRun: error
strictDepBuilds: true
dangerouslyAllowAllBuilds: false
blockExoticSubdeps: true
minimumReleaseAge: 1440
trustPolicy: no-downgrade
trustLockfile: false
`;

const npmrcPolicy = `engine-strict=true
audit=true
save-exact=true
package-manager-strict=true
strict-peer-dependencies=true
auto-install-peers=false
prefer-frozen-lockfile=true
verify-store-integrity=true
@vigilioyonatan:registry=https://npm.pkg.github.com
always-auth=true
`;

function createRepository(): string {
  const root = mkdtempSync(path.join(tmpdir(), 'vigilio-package-manager-policy-'));
  writeFileSync(
    path.join(root, 'package.json'),
    JSON.stringify({
      packageManager: 'pnpm@11.7.0',
      engines: { node: '>=24 <25', pnpm: '11.7.0' },
    }),
  );
  writeFileSync(path.join(root, 'pnpm-workspace.yaml'), workspacePolicy);
  writeFileSync(path.join(root, '.npmrc'), npmrcPolicy);
  return root;
}

describe('package manager policy', () => {
  it('accepts an exact, hardened pnpm configuration', () => {
    expect(validatePackageManagerPolicy(createRepository())).toEqual([]);
  });

  it('rejects version drift and credentials committed to npmrc', () => {
    const root = createRepository();
    writeFileSync(
      path.join(root, 'package.json'),
      JSON.stringify({
        packageManager: 'pnpm@11.7.0',
        engines: { node: '>=22 <23', pnpm: '11.4.0' },
      }),
    );
    writeFileSync(
      path.join(root, '.npmrc'),
      `${npmrcPolicy}//npm.pkg.github.com/:_authToken=secret`,
    );

    const errors = validatePackageManagerPolicy(root);
    expect(errors).toContain('package.json: engines.pnpm must match packageManager');
    expect(errors).toContain(
      'package.json: engines.node must target pnpm-workspace.yaml nodeVersion',
    );
    expect(errors).toContain('.npmrc: credentials must not be stored in the repository');
  });
});
