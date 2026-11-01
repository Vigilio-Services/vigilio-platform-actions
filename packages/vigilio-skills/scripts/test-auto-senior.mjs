#!/usr/bin/env node
// Smoke offline, no network and no consumer sources modified.
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { existsSync, mkdtempSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';

const root = path.resolve(import.meta.dirname, '..');
const project = mkdtempSync(path.join(tmpdir(), 'vigilio-senior-test-'));
const bashExecutable =
  process.platform === 'win32'
    ? ['C:\\Program Files\\Git\\bin\\bash.exe', 'C:\\Program Files\\Git\\usr\\bin\\bash.exe'].find(
        existsSync,
      ) || 'bash'
    : 'bash';

function run(file, args = [], env = process.env) {
  const resolvedFile = file === 'bash' ? bashExecutable : file;
  const normalizedArgs = args.map((arg) =>
    typeof arg === 'string' && file === 'bash' ? arg.replaceAll('\\', '/') : arg,
  );
  return spawnSync(resolvedFile, normalizedArgs, { cwd: root, env, encoding: 'utf8' });
}
try {
  writeFileSync(
    path.join(project, 'package.json'),
    JSON.stringify({ dependencies: { react: '19.0.0', 'react-hook-form': '7.0.0' } }),
  );
  writeFileSync(
    path.join(project, 'AGENTS.md'),
    '# Existing project rules\n\n- Do not change business invariant.\n',
  );
  let r = run('node', ['scripts/init-consumer.mjs', '--root', project]);
  assert.equal(r.status, 0, r.stderr);
  assert.equal(
    existsSync(path.join(project, 'scripts/vigilio-services-check.sh')),
    false,
    'dry-run writes files',
  );
  r = run('node', ['scripts/init-consumer.mjs', '--root', project, '--apply']);
  assert.equal(r.status, 0, r.stderr);
  assert.ok(existsSync(path.join(project, 'scripts/vigilio-services-check.sh')));
  let agents = readFileSync(path.join(project, 'AGENTS.md'), 'utf8');
  assert.match(agents, /Existing project rules/);
  assert.match(agents, /VIGILIO AUTO-SENIOR: managed start/);
  r = run('node', ['scripts/init-consumer.mjs', '--root', project, '--apply']);
  assert.equal(r.status, 0, r.stderr);
  agents = readFileSync(path.join(project, 'AGENTS.md'), 'utf8');
  assert.equal(agents.match(/VIGILIO AUTO-SENIOR: managed start/g)?.length, 1);
  r = run('node', [
    'assets/skills/vigilio-auto-senior/scripts/inspect-project.mjs',
    '--root',
    project,
  ]);
  assert.equal(r.status, 0, r.stderr);
  const inv = JSON.parse(r.stdout);
  assert.ok(inv.stack.includes('react-hook-form'));
  assert.equal(inv.tests_status, 'NOT_RUN');
  r = run('bash', [path.join(project, 'scripts/vigilio-services-check.sh')], {
    ...process.env,
    PGHOST: '',
    REDIS_HOST: '',
    HTTP_HEALTH_URL: '',
    AWS_CHECK: '0',
  });
  assert.equal(r.status, 0, r.stdout + r.stderr);
  assert.match(r.stdout, /NOT_RUN=4/);
  r = run('bash', [path.join(project, 'scripts/vigilio-services-check.sh')], {
    ...process.env,
    PGHOST: '',
    REDIS_HOST: '',
    HTTP_HEALTH_URL: '',
    AWS_CHECK: '0',
    VIGILIO_REQUIRE_PG: '1',
  });
  assert.equal(r.status, 2, r.stdout + r.stderr);
  assert.match(r.stdout, /BLOCKED=1/);
  const existing = 'my app preflight is authoritative';
  writeFileSync(path.join(project, 'scripts/vigilio-services-check.sh'), existing);
  r = run('node', ['scripts/init-consumer.mjs', '--root', project, '--apply']);
  assert.equal(r.status, 0, r.stderr);
  assert.equal(
    readFileSync(path.join(project, 'scripts/vigilio-services-check.sh'), 'utf8'),
    existing,
    'overwrote existing script',
  );
  r = run('node', ['scripts/test-skill-routing.mjs']);
  assert.equal(r.status, 0, r.stdout + r.stderr);
  r = run('node', ['scripts/build-skills-registry.mjs', '--check']);
  assert.equal(r.status, 0, r.stdout + r.stderr);
  const cat = JSON.parse(readFileSync(path.join(root, 'assets/skills-registry.json'), 'utf8'));
  assert.equal(
    cat.count,
    readdirSync(path.join(root, 'assets/skills'), { withFileTypes: true }).filter((x) =>
      x.isDirectory(),
    ).length,
  );
  assert.ok(cat.skills.find((x) => x.name === 'review-code-change'));
  console.log(
    'PASS Auto-Senior offline smoke: init non-destructive, idempotence, discovery, blocked/not_run semantics, registry.',
  );
} finally {
  try {
    rmSync(project, { recursive: true, force: true, maxRetries: 5, retryDelay: 100 });
  } catch {}
}
