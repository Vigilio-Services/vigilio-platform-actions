import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const repositoryRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..', '..');

function workflow(name: string): string {
  return readFileSync(path.join(repositoryRoot, '.github', 'workflows', name), 'utf8');
}

describe('reusable workflow performance and security contracts', () => {
  it('isolates BuildKit caches and prevents pull requests from writing them', () => {
    const content = workflow('shared-container-build-push.yml');

    expect(content).toContain('id: build-cache');
    expect(content).toMatch(
      /cache-from: type=gha,scope=\$\{\{ steps\.build-cache\.outputs\.scope \}\}/,
    );
    expect(content).toContain("github.event_name == 'push'");
    expect(content).toContain("github.event_name == 'merge_group'");
    expect(content).not.toMatch(/cache-to:\s*type=gha,mode=max\s*$/m);
    expect(content).toContain('provenance: mode=max');
    expect(content).toContain('sbom: true');
  });

  it('keeps deep scans blocking while making SARIF publication optional', () => {
    const backend = workflow('shared-backend-node-nest-ci.yml');
    const container = workflow('shared-container-build-push.yml');

    expect(backend).toContain('publish-security-sarif:');
    expect(backend).toContain('actions/cache/restore@');
    expect(backend).toContain('actions/cache/save@');
    expect(backend).toContain(
      'semgrep scan --config p/owasp-top-ten --sarif --output semgrep.sarif --error',
    );
    expect(backend.match(/exit-code:\s*1/g)?.length).toBeGreaterThanOrEqual(2);
    expect(backend).toContain('inputs.publish-security-sarif');

    expect(container).toContain('upload-sarif:');
    expect(container).toContain('exit-code: 1');
    expect(container).toContain('inputs.upload-sarif');
  });
});
