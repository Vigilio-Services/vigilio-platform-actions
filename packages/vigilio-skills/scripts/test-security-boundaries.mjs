#!/usr/bin/env node
/** Offline regression tests for Vigilio bootstrap and service preflight. */
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import {
  chmodSync,
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  symlinkSync,
  writeFileSync,
} from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const packageRoot = path.resolve(import.meta.dirname, '..');
const template = path.join(
  packageRoot,
  'assets/templates/project/scripts/vigilio-services-check.sh',
);
const temp = mkdtempSync(path.join(os.tmpdir(), 'vigilio-boundary-test-'));
const root = path.join(temp, 'project');
const external = path.join(temp, 'external');
const bins = path.join(temp, 'bin');
mkdirSync(root);
mkdirSync(external);
mkdirSync(bins);
writeFileSync(path.join(root, 'package.json'), '{"name":"consumer"}\n');
writeFileSync(path.join(root, 'AGENTS.md'), '# Local rules\n');
const baseline = '# Local rules\n';
const bashExecutable =
  process.platform === 'win32'
    ? ['C:\\Program Files\\Git\\bin\\bash.exe', 'C:\\Program Files\\Git\\usr\\bin\\bash.exe'].find(
        existsSync,
      ) || 'bash'
    : '/bin/bash';

function install() {
  return spawnSync(process.execPath, ['scripts/init-consumer.mjs', '--root', root, '--apply'], {
    cwd: packageRoot,
    encoding: 'utf8',
  });
}
function preflight(extra = {}) {
  const envPath =
    process.platform === 'win32'
      ? `${bins};C:\\Program Files\\Git\\usr\\bin;C:\\Program Files\\Git\\bin;${process.env.PATH || ''}`
      : bins;
  const env = {
    PATH: envPath,
    PGHOST: '',
    PGDATABASE: '',
    REDIS_HOST: '',
    HTTP_HEALTH_URL: '',
    AWS_CHECK: '0',
    VIGILIO_REQUIRE_PG: '0',
    VIGILIO_PG_SQL_CHECK: '0',
    VIGILIO_REQUIRE_PG_SQL: '0',
    VIGILIO_PG_SCHEMA: '',
    VIGILIO_PG_MIGRATION_TABLE: '',
    ...extra,
  };
  const templatePath = template.replaceAll('\\', '/');
  return spawnSync(bashExecutable, [templatePath], { env, encoding: 'utf8' });
}
function executable(name, contents) {
  const target = path.join(bins, name);
  writeFileSync(target, `#!/bin/sh\n${contents}\n`);
  chmodSync(target, 0o755);
}
try {
  // A nested directory symlink must be rejected before ANY file is created.
  symlinkSync(external, path.join(root, 'scripts'), 'dir');
  let result = install();
  assert.equal(result.status, 2, result.stdout + result.stderr);
  assert.ok(!existsSync(path.join(external, 'vigilio-services-check.sh')));
  assert.equal(readFileSync(path.join(root, 'AGENTS.md'), 'utf8'), baseline);
  assert.ok(!existsSync(path.join(root, '.env.vigilio.example')));
  rmSync(path.join(root, 'scripts'));

  mkdirSync(path.join(root, 'scripts'));
  const outsideFile = path.join(external, 'do-not-change.txt');
  writeFileSync(outsideFile, 'untouched');
  symlinkSync(outsideFile, path.join(root, 'scripts/vigilio-services-check.sh'), 'file');
  result = install();
  assert.equal(result.status, 2, result.stdout + result.stderr);
  assert.equal(readFileSync(outsideFile, 'utf8'), 'untouched');
  assert.ok(!existsSync(path.join(root, '.env.vigilio.example')));
  rmSync(path.join(root, 'scripts/vigilio-services-check.sh'));

  symlinkSync(external, path.join(root, '.opencode'), 'dir');
  result = install();
  assert.equal(result.status, 2, result.stdout + result.stderr);
  assert.ok(!existsSync(path.join(external, 'commands/vigilio-skill.md')));
  rmSync(path.join(root, '.opencode'));

  symlinkSync(outsideFile, path.join(root, 'scripts/vigilio-services-check.sh'));
  result = spawnSync(process.execPath, ['scripts/init-consumer.mjs', '--root', root], {
    cwd: packageRoot,
    encoding: 'utf8',
  });
  assert.equal(result.status, 2, 'dry run must flag symlinks too');
  rmSync(path.join(root, 'scripts/vigilio-services-check.sh'));

  // Valid normal bootstrap; idempotence and no replacement of local instructions.
  result = install();
  assert.equal(result.status, 0, result.stderr);
  const agents = readFileSync(path.join(root, 'AGENTS.md'), 'utf8');
  assert.match(agents, /Local rules/);
  result = install();
  assert.equal(result.status, 0, result.stderr);
  assert.equal(readFileSync(path.join(root, 'AGENTS.md'), 'utf8'), agents);

  // When a service is configured, missing tools must fail closed.
  result = preflight({ REDIS_HOST: '127.0.0.1' });
  assert.equal(result.status, 2, result.stdout + result.stderr);
  assert.match(result.stdout, /BLOCKED\s+Valkey_Redis/);
  result = preflight({ AWS_CHECK: '1' });
  assert.equal(result.status, 2, result.stdout + result.stderr);
  assert.match(result.stdout, /BLOCKED\s+AWS_STS/);
  result = preflight({ VIGILIO_S3_BUCKET: 'bucket-in-test' });
  assert.equal(result.status, 2, result.stdout + result.stderr);
  assert.match(result.stdout, /BLOCKED\s+AWS_STS/);

  // A declared SQL check is mandatory. A TCP-ready database is insufficient.
  executable('pg_isready', 'exit 0');
  result = preflight({ PGHOST: 'localhost', PGDATABASE: 'test', VIGILIO_PG_SQL_CHECK: '1' });
  assert.equal(result.status, 2, result.stdout + result.stderr);
  assert.match(result.stdout, /BLOCKED\s+PostgreSQL_SQL/);
  assert.doesNotMatch(result.stdout, /PASS\s+PostgreSQL_SQL/);

  // A SQL client error must be a failure, not an unverified success.
  executable('psql', 'exit 1');
  result = preflight({ PGHOST: 'localhost', PGDATABASE: 'test', VIGILIO_REQUIRE_PG_SQL: '1' });
  assert.equal(result.status, 1, result.stdout + result.stderr);
  assert.match(result.stdout, /FAIL\s+PostgreSQL_SQL/);

  // An exit status of 0 without the actual SELECT 1 result is NOT success.
  executable('psql', 'exit 0');
  result = preflight({ PGHOST: 'localhost', PGDATABASE: 'test', VIGILIO_REQUIRE_PG_SQL: '1' });
  assert.equal(result.status, 1, result.stdout + result.stderr);
  assert.match(result.stdout, /FAIL\s+PostgreSQL_SQL/);

  // A working SQL client gives PASS, yet schema absence must fail separately.
  executable('psql', 'echo 1');
  result = preflight({ PGHOST: 'localhost', PGDATABASE: 'test', VIGILIO_PG_SQL_CHECK: '1' });
  assert.equal(result.status, 0, result.stdout + result.stderr);
  assert.match(result.stdout, /PASS\s+PostgreSQL_SQL/);
  result = preflight({ PGHOST: 'localhost', PGDATABASE: 'test', VIGILIO_PG_SCHEMA: 'missing' });
  assert.equal(result.status, 1, result.stdout + result.stderr);
  assert.match(result.stdout, /FAIL\s+PostgreSQL_Schema/);
  // A schema probe returning 't' but an error exit status must fail.
  executable('psql', 'echo t; exit 1');
  result = preflight({ PGHOST: 'localhost', PGDATABASE: 'test', VIGILIO_PG_SCHEMA: 'public' });
  assert.equal(result.status, 1, result.stdout + result.stderr);
  assert.match(result.stdout, /FAIL\s+PostgreSQL_SQL/);
  executable('psql', 'echo 1');
  result = preflight({
    PGHOST: 'localhost',
    PGDATABASE: 'test',
    VIGILIO_PG_SCHEMA: "unsafe'; DROP TABLE x;--",
  });
  assert.equal(result.status, 2, result.stdout + result.stderr);
  assert.match(result.stdout, /BLOCKED\s+PostgreSQL_Schema/);

  // Required SQL check without database connection cannot succeed.
  result = preflight({ VIGILIO_REQUIRE_PG_SQL: '1' });
  assert.equal(result.status, 2, result.stdout + result.stderr);
  assert.match(result.stdout, /BLOCKED\s+PostgreSQL/);

  result = preflight();
  assert.equal(result.status, 0, result.stdout + result.stderr);
  assert.match(result.stdout, /NOT_RUN=4/);
  console.log(
    'PASS security boundaries: preflight SQL fail-closed, schema checks, symlinks, no-overwrite and idempotence.',
  );
} finally {
  try {
    rmSync(temp, { recursive: true, force: true, maxRetries: 5, retryDelay: 100 });
  } catch {}
}
