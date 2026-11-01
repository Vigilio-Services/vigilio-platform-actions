#!/usr/bin/env node
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';

const pkg = path.resolve(import.meta.dirname, '..');
const router = path.join(pkg, 'assets/skills/vigilio-auto-senior/scripts/route-skills.mjs');
const root = mkdtempSync(path.join(tmpdir(), 'vigilio-uxui-router-'));
const mk = (rel, data) => {
  const f = path.join(root, rel);
  mkdirSync(path.dirname(f), { recursive: true });
  writeFileSync(f, data);
};
const rm = (rel) => rmSync(path.join(root, rel), { force: true, recursive: true });
const route = (task, scope = null) => {
  const r = spawnSync(
    process.execPath,
    [router, '--root', root, '--task', task, ...(scope ? ['--scope', scope] : [])],
    { encoding: 'utf8' },
  );
  assert.equal(r.status, 0, r.stderr);
  return JSON.parse(r.stdout);
};
const has = (r, n) => r.selected.some((s) => s.name === n);
try {
  let r = route('Quiero crear una app fintech desktop con buena experiencia usuario');
  assert.equal(r.decision_required, true);
  assert.ok(has(r, 'ux-product-discovery'));
  assert.ok(
    !has(r, 'ux-desktop-experience') && !has(r, 'cpp-native-build-feature'),
    'No imponer stack sin repo',
  );
  r = route('Quiero hacer un login');
  assert.equal(r.decision_required, true);
  assert.ok(has(r, 'ux-product-discovery'));
  assert.ok(!has(r, 'ux-web-experience') && !has(r, 'ux-mobile-experience'));
  mk('apps/game/project.godot', 'config_version=5\n[application]\nconfig/name="Demo"');
  r = route('Diseñar HUD gamepad y menu juego personalizado');
  for (const n of [
    'ux-game-experience',
    'ui-design-system',
    'ux-accessibility',
    'review-code-change',
  ])
    assert.ok(has(r, n), n);
  assert.ok(!has(r, 'ux-web-experience') && !has(r, 'ux-mobile-experience'));
  r = route('Añadir salto y sonido al jugador');
  assert.ok(has(r, 'godot-animation-audio'));
  rm('apps');
  mk(
    'apps/mobile/package.json',
    JSON.stringify({ dependencies: { expo: '54.0.0', 'react-native': '0.81.0', react: '19.1.0' } }),
  );
  r = route('Mejora experiencia movil android ios safe area');
  assert.equal(r.detected.mobile, true);
  assert.ok(has(r, 'ux-mobile-experience'));
  assert.ok(!has(r, 'ux-web-experience'));
  rm('apps');
  mk('apps/web/package.json', JSON.stringify({ dependencies: { react: '19.1.0' } }));
  r = route('Mejora el dashboard responsive y formulario');
  assert.ok(has(r, 'ux-web-experience'));
  assert.ok(!has(r, 'ux-mobile-experience'));
  rm('apps');
  mk(
    'apps/desktop/CMakeLists.txt',
    'project(desktop LANGUAGES CXX)\nfind_package(Qt6 REQUIRED COMPONENTS Widgets)',
  );
  r = route('Optimiza UX desktop ventanas y atajos');
  assert.ok(has(r, 'ux-desktop-experience'));
  assert.ok(!has(r, 'ux-game-experience'));
  rm('apps');
  mk(
    'Cargo.toml',
    '[package]\nname="backend"\nversion="0.1.0"\nedition="2021"\n[dependencies]\naxum="0.8"',
  );
  r = route('Implementar endpoint REST de salud en Rust');
  assert.ok(
    !has(r, 'ux-desktop-experience') &&
      !has(r, 'ux-game-experience') &&
      !has(r, 'ui-art-direction'),
  );
  assert.ok(
    r.selected.every((x) => x.loaded === false),
    'router never marks skill loaded',
  );
  console.log(
    'PASS UX/UI routing: fintech idea, Godot HUD, mobile Expo, React web, Qt desktop, backend without UX over-selection, no fictitious loads',
  );
} finally {
  rmSync(root, { force: true, recursive: true });
}
