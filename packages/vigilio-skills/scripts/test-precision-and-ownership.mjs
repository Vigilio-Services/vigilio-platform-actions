#!/usr/bin/env node
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const ROOT = path.resolve(import.meta.dirname, '..');
const route = path.join(ROOT, 'assets/skills/vigilio-auto-senior/scripts/route-skills.mjs');
const plan = path.join(ROOT, 'assets/skills/vigilio-auto-senior/scripts/plan-skill-context.mjs');
let tests = 0;
function run(script, args) {
  return spawnSync('node', [script, ...args], { encoding: 'utf8', timeout: 12000 });
}
function check(ok, msg) {
  assert.ok(ok, msg);
  tests++;
}
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'vigilio-ownership-'));
try {
  const godot = path.join(tmp, 'godot');
  fs.mkdirSync(godot);
  fs.writeFileSync(
    path.join(godot, 'project.godot'),
    'config_version=5\n[application]\nconfig/name="Test"\n',
  );
  let r = run(route, [
    '--root',
    godot,
    '--task',
    'quiero organizar scripts y const de un juego Godot',
  ]);
  check(r.status === 0, 'router Godot exit');
  const g = JSON.parse(r.stdout);
  check(g.detected.godot === true, 'Godot detectado');
  check(
    g.selected.some((x) => x.name === 'symbol-ownership-architecture'),
    'ownership seleccionado por intención',
  );
  check(
    g.selected.every((x) => x.loaded === false),
    'solo propuestas',
  );
  const json = path.join(tmp, 'route.json');
  fs.writeFileSync(json, JSON.stringify(g));
  let p = run(plan, ['--routing', json]);
  check(p.status === 0, 'presupuesto normal');
  const result = JSON.parse(p.stdout);
  check(
    result.count >= 2 && result.read_order.every((x) => x.status === 'PROPOSED_NOT_LOADED'),
    'no lectura fingida',
  );
  check(
    result.read_order.every((x) => /^[a-f0-9]{64}$/.test(x.sha256)),
    'hash correcto',
  );
  p = run(plan, ['--routing', json, '--budget-bytes', '512']);
  check(
    p.status === 3 && p.stdout.includes('BLOCKED_BUDGET_REVIEW'),
    'presupuesto insuficiente bloquea',
  );
  const fake = { ...g, selected: [{ name: 'evil', source: path.join(tmp, 'evil', 'SKILL.md') }] };
  fs.mkdirSync(path.join(tmp, 'evil'));
  fs.writeFileSync(path.join(tmp, 'evil', 'SKILL.md'), 'Secret');
  const evil = path.join(tmp, 'evil.json');
  fs.writeFileSync(evil, JSON.stringify(fake));
  p = run(plan, ['--routing', evil]);
  check(p.status === 2, 'ruta externa bloqueada');
  const nest = path.join(tmp, 'nest');
  fs.mkdirSync(nest);
  fs.writeFileSync(
    path.join(nest, 'package.json'),
    JSON.stringify({ dependencies: { '@nestjs/core': '11.0.0' } }),
  );
  r = run(route, ['--root', nest, '--task', 'extraer constants interfaces y types de AuthService']);
  check(r.status === 0, 'Nest routing ejecutable');
  const n = JSON.parse(r.stdout);
  check(
    n.selected.some((x) => x.name === 'symbol-ownership-architecture'),
    'ownership Nest',
  );
  check(
    n.selected.some((x) => x.name === 'node-nest-build-feature'),
    'feature Nest preservada',
  );
  const c = path.join(tmp, 'purec');
  fs.mkdirSync(c);
  fs.writeFileSync(
    path.join(c, 'CMakeLists.txt'),
    'cmake_minimum_required(VERSION 3.20)\nproject(foo LANGUAGES C)\n',
  );
  r = run(route, ['--root', c, '--task', 'reorganizar constantes']);
  check(
    !JSON.parse(r.stdout).selected.some((x) => x.name === 'cpp-native-build-feature'),
    'C puro no activa C++',
  );
  console.log(`PASS precision ownership tests=${tests} (positive + negative)`);
} finally {
  fs.rmSync(tmp, { recursive: true, force: true });
}
