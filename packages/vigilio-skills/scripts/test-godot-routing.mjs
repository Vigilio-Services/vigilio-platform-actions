#!/usr/bin/env node
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';

const pkg = path.resolve(import.meta.dirname, '..');
const router = path.join(pkg, 'assets/skills/vigilio-auto-senior/scripts/route-skills.mjs');
const tmp = mkdtempSync(path.join(tmpdir(), 'vigilio-godot-route-'));
const mk = (rel, value) => {
  const f = path.join(tmp, rel);
  mkdirSync(path.dirname(f), { recursive: true });
  writeFileSync(f, value);
};
const remove = (rel) => rmSync(path.join(tmp, rel), { recursive: true, force: true });
const route = (task, additional = []) => {
  const r = spawnSync(process.execPath, [router, '--root', tmp, '--task', task, ...additional], {
    encoding: 'utf8',
  });
  assert.equal(r.status, 0, r.stderr);
  return JSON.parse(r.stdout);
};
const has = (r, n) => r.selected.some((s) => s.name === n);
try {
  let r = route('Quiero crear un videojuego de plataformas 2D para móvil');
  assert.equal(r.project_found, false);
  assert.equal(r.decision_required, true);
  assert.ok(
    has(r, 'godot-project-architecture'),
    'greenfield game must surface architecture option',
  );
  assert.ok(!has(r, 'godot-backend-multiplayer'), 'should not impose backend on new local game');
  mk('project.godot', 'config_version=5\n[application]\nconfig/name="Demo"\n');
  r = route('Agregar salto 2D y sonido de aterrizaje');
  assert.equal(r.detected.godot, true);
  assert.equal(r.project_found, true);
  for (const n of [
    'godot-project-architecture',
    'godot-build-gameplay',
    'godot-animation-audio',
    'godot-testing-quality',
    'review-code-change',
  ])
    assert.ok(has(r, n), `missing ${n}`);
  assert.ok(!has(r, 'godot-backend-multiplayer'), 'offline jump should not use online backend');
  assert.ok(r.selected.every((x) => x.loaded === false));
  r = route('Agregar lobby multijugador online y login con API backend');
  assert.ok(has(r, 'godot-backend-multiplayer'));
  r = route('Publicar release Godot para desktop y web');
  assert.ok(has(r, 'godot-delivery'));
  mk('apps/api/Cargo.toml', '[package]\nname="api"\nversion="0.1.0"\nedition="2021"');
  r = route('Agregar salto en juego Godot', ['--scope', '.']);
  assert.ok(has(r, 'godot-build-gameplay'));
  r = route('Cambiar gameplay en Godot', ['--scope', 'apps/api']);
  assert.equal(r.detected.godot, false);
  remove('apps');
  remove('project.godot');
  mk('CMakeLists.txt', 'cmake_minimum_required(VERSION 3.21)\nproject(pure_c LANGUAGES C)\n');
  r = route('Optimiza este proyecto C');
  assert.ok(!has(r, 'godot-build-gameplay') && !has(r, 'cpp-native-build-feature'));
  console.log(
    'PASS Godot routing: greenfield, 2D jump SFX, API multiplayer, delivery, scoped mixed repo, C-only, NOT_LOADED.',
  );
} finally {
  rmSync(tmp, { recursive: true, force: true });
}
