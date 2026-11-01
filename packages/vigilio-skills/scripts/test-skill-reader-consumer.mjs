#!/usr/bin/env node
/** Verify skill reader on distributed and consumer layouts; all negative tests are fail-closed. */
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const repo = path.resolve(import.meta.dirname, '..');
const reader = path.join(repo, 'assets/skills/vigilio-auto-senior/scripts/read-skill.mjs');
let count = 0;
function call(root, skill, reference) {
  const a = [reader, '--root', root, '--skill', skill];
  if (reference !== undefined) a.push('--reference', reference);
  return spawnSync(process.execPath, a, { encoding: 'utf8', timeout: 12000 });
}
function ok(condition, text) {
  assert.ok(condition, text);
  count++;
}
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'vigilio-skill-consumer-'));
try {
  const consumer = path.join(tmp, 'consumer');
  const installed = path.join(consumer, '.opencode/skills');
  const rootSkill = path.join(installed, 'alpha');
  const rootDocs = path.join(consumer, '.vigilio-docs/standards/ai');
  fs.mkdirSync(rootSkill, { recursive: true });
  fs.mkdirSync(rootDocs, { recursive: true });
  fs.writeFileSync(
    path.join(rootSkill, 'SKILL.md'),
    '# Alpha\n[Canon](../.vigilio-docs/standards/ai/policy.md)',
  );
  fs.mkdirSync(path.join(rootSkill, 'references'));
  fs.writeFileSync(path.join(rootSkill, 'references/usage.md'), '# Usage');
  fs.writeFileSync(path.join(rootDocs, 'policy.md'), '# Policy for consumer');
  let r = call(consumer, 'alpha');
  ok(
    r.status === 0 && JSON.parse(r.stdout).content.includes('# Alpha'),
    'SKILL.md consumer completa',
  );
  r = call(consumer, 'alpha', '../.vigilio-docs/standards/ai/policy.md');
  ok(
    r.status === 0 && JSON.parse(r.stdout).content.includes('consumer'),
    'doc canonical root consumer',
  );
  r = call(consumer, 'alpha', 'references/usage.md');
  ok(r.status === 0 && JSON.parse(r.stdout).content.includes('Usage'), 'reference skill local');
  // Consumer may also install docs inside .opencode/skills/.vigilio-docs.
  const localDocs = path.join(installed, '.vigilio-docs/standards/ai');
  fs.mkdirSync(localDocs, { recursive: true });
  fs.writeFileSync(path.join(localDocs, 'policy.md'), '# Policy colocated');
  r = call(consumer, 'alpha', '../.vigilio-docs/standards/ai/policy.md');
  ok(
    r.status === 0 && JSON.parse(r.stdout).content.includes('colocated'),
    'doc canonical colocated',
  );
  fs.rmSync(path.join(localDocs, 'policy.md'));
  fs.writeFileSync(path.join(consumer, '.env.secret'), 'SECRET');
  r = call(consumer, 'alpha', '../../../../../.env.secret');
  ok(r.status === 2, 'path traversal rejected');
  r = call(consumer, 'alpha', '/etc/passwd');
  ok(r.status === 2, 'absolute path rejected');
  r = call(consumer, 'alpha', 'https://example.com/policy.md');
  ok(r.status === 2, 'URL rejected');
  r = call(consumer, 'alpha', '../beta/SKILL.md');
  ok(r.status === 2, 'other skill not authorized');
  const external = path.join(tmp, 'external.md');
  fs.writeFileSync(external, 'private outside');
  fs.symlinkSync(external, path.join(rootSkill, 'references/escape.md'));
  r = call(consumer, 'alpha', 'references/escape.md');
  ok(r.status === 2 && !r.stdout.includes('private outside'), 'symlink skill escape rejected');
  fs.symlinkSync(external, path.join(rootDocs, 'leak.md'));
  r = call(consumer, 'alpha', '../.vigilio-docs/standards/ai/leak.md');
  ok(r.status === 2 && !r.stdout.includes('private outside'), 'symlink docs escape rejected');
  r = call(consumer, 'alpha', '../.vigilio-docs/standards/ai/missing.md');
  ok(r.status === 2, 'missing mandatory doc is BLOCKED');
  // Bundled distribution still works and only authorizes its bundled canonical docs.
  r = call(
    repo,
    'adaptive-context-budget',
    '../.vigilio-docs/standards/ai/adaptive-context-budget-and-evidence.md',
  );
  ok(r.status === 0 && JSON.parse(r.stdout).content.includes('Contexto'), 'bundled canonical docs');
  console.log(`PASS skill-reader-consumer tests=${count}`);
} finally {
  fs.rmSync(tmp, { recursive: true, force: true });
}
