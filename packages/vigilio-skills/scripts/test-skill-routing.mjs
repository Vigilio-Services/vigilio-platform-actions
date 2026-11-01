#!/usr/bin/env node
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';

const root = path.resolve(import.meta.dirname, '..');
const tmp = mkdtempSync(path.join(tmpdir(), 'vigilio-route-'));
function run(task) {
  const out = spawnSync(
    process.execPath,
    ['assets/skills/vigilio-auto-senior/scripts/route-skills.mjs', '--root', tmp, '--task', task],
    { cwd: root, encoding: 'utf8' },
  );
  assert.equal(out.status, 0, out.stderr);
  return JSON.parse(out.stdout);
}
function names(result) {
  return result.selected.map((s) => s.name);
}
try {
  writeFileSync(
    path.join(tmp, 'package.json'),
    JSON.stringify({ dependencies: { react: '19.0.0', 'react-hook-form': '7.0.0' } }),
  );
  let r = run('Agregar login con React Hook Form');
  assert.equal(r.intent, 'feature');
  assert.equal(r.state, 'PROPOSED_NOT_LOADED');
  assert.ok(names(r).includes('web-mfe-build-feature'));
  assert.ok(names(r).includes('web-mfe-security-delivery'));
  assert.ok(names(r).includes('review-code-change'));
  assert.ok(!names(r).includes('node-nest-build-feature'));
  assert.ok(r.selected.every((s) => s.loaded === false));
  r = run('Revisa este PR que rompe contratos');
  assert.equal(r.intent, 'review');
  assert.ok(names(r).includes('review-code-change'));
  assert.ok(!names(r).includes('web-mfe-build-feature'), 'review must be read-only');
  writeFileSync(
    path.join(tmp, 'package.json'),
    JSON.stringify({ dependencies: { '@nestjs/core': '11.0.0', 'drizzle-orm': '0.44.0' } }),
  );
  r = run('Crear CRUD endosos SQL');
  assert.ok(names(r).includes('node-nest-build-feature'));
  assert.ok(names(r).includes('node-nest-persistence'));
  assert.ok(!names(r).includes('web-mfe-build-feature'));
  r = run('Diseñar una relación polimórfica morphTo con tenant_id, FK e índices');
  assert.ok(
    names(r).includes('node-nest-persistence'),
    'poly relations must route to the persistence owner',
  );
  writeFileSync(
    path.join(tmp, 'composer.json'),
    JSON.stringify({ require: { 'laravel/framework': '^12.0' } }),
  );
  writeFileSync(path.join(tmp, 'package.json'), JSON.stringify({ dependencies: {} }));
  r = run('Agregar asociaciones polimórficas Eloquent morphTo');
  assert.ok(
    names(r).includes('php-laravel-persistence'),
    'Laravel morphTo must route to PHP persistence',
  );
  assert.ok(!names(r).includes('node-nest-persistence'), 'no cross-stack leakage');
  console.log(
    'PASS deterministic skill routing: web forms/auth, PR review, NestJS and Laravel polymorphic persistence; none falsely marked loaded.',
  );
} finally {
  rmSync(tmp, { recursive: true, force: true });
}
