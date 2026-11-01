#!/usr/bin/env node
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';

const packageRoot = path.resolve(import.meta.dirname, '..');
const router = path.join(packageRoot, 'assets/skills/vigilio-auto-senior/scripts/route-skills.mjs');
const tmp = mkdtempSync(path.join(tmpdir(), 'vigilio-native-routing-'));
const mk = (rel, text) => {
  const p = path.join(tmp, rel);
  mkdirSync(path.dirname(p), { recursive: true });
  writeFileSync(p, text);
};
const remove = (rel) => {
  try {
    rmSync(path.join(tmp, rel), { recursive: true, force: true });
  } catch {}
};
function route(task) {
  const r = spawnSync(process.execPath, [router, '--root', tmp, '--task', task], {
    encoding: 'utf8',
  });
  assert.equal(r.status, 0, r.stderr);
  const j = JSON.parse(r.stdout);
  assert.equal(j.state, 'PROPOSED_NOT_LOADED');
  assert.ok(j.selected.every((s) => !s.loaded));
  return j;
}
function has(result, name) {
  return result.selected.some((s) => s.name === name);
}
try {
  let r = route('Quiero crear una app de escritorio fintech');
  assert.equal(r.decision_required, true, 'without repo architecture must require decision');
  assert.ok(
    !has(r, 'rust-native-build-feature') && !has(r, 'cpp-native-build-feature'),
    'must not impose stack',
  );
  mk('Cargo.toml', '[workspace]\nmembers=["apps/desktop"]\n');
  mk(
    'apps/desktop/Cargo.toml',
    '[package]\nname="demo"\nversion="0.1.0"\nedition="2021"\n[dependencies]\ngpui="0.1"\n',
  );
  r = route('Agrega una terminal GPUI al editor');
  assert.equal(r.detected.rust, true);
  assert.equal(r.detected.gpui, true);
  assert.ok(
    has(r, 'rust-native-build-feature') &&
      has(r, 'rust-native-testing') &&
      has(r, 'rust-agent-runtime-security'),
  );
  assert.ok(!has(r, 'cpp-native-build-feature') && !has(r, 'cpp-qt-webengine'));
  remove('Cargo.toml');
  remove('apps');
  mk(
    'CMakeLists.txt',
    'cmake_minimum_required(VERSION 3.20)\nproject(desktop LANGUAGES CXX)\nfind_package(Qt6 REQUIRED COMPONENTS Widgets)\ntarget_link_libraries(demo PRIVATE Qt6::Widgets)\n',
  );
  r = route('Agrega formulario de inventario al desktop Qt');
  assert.ok(has(r, 'cpp-native-build-feature') && has(r, 'cpp-native-testing'));
  assert.ok(!has(r, 'cpp-qt-webengine'), 'Qt Widgets is not Chromium');
  mk(
    'apps/browser/CMakeLists.txt',
    'find_package(Qt6 REQUIRED COMPONENTS WebEngineWidgets)\ntarget_link_libraries(browser PRIVATE Qt6::WebEngineWidgets)\n',
  );
  r = route('Implementa perfiles privados y cookies en navegador');
  assert.equal(r.detected.webengine, true);
  assert.ok(has(r, 'cpp-qt-webengine'));
  assert.ok(has(r, 'cpp-native-security'));
  remove('CMakeLists.txt');
  remove('apps');
  mk(
    'apps/web/package.json',
    JSON.stringify({ dependencies: { react: '19.0.0', 'react-hook-form': '7.0.0' } }),
  );
  mk(
    'apps/api/package.json',
    JSON.stringify({ dependencies: { '@nestjs/core': '11.0.0', 'drizzle-orm': '0.44.0' } }),
  );
  r = route('Crear login frontend y API con auth');
  assert.equal(r.detected.web, true);
  assert.equal(r.detected.nestjs, true);
  assert.ok(has(r, 'web-mfe-build-feature') && has(r, 'node-nest-build-feature'));
  remove('apps');
  mk('Cargo.toml', '[package]\nname="bevy-game"\nversion="0.1.0"\nedition="2021"');
  // Future arbitrary skill installed in a consumer, not hardcoded in router or registry.
  mk(
    '.opencode/skills/vigilio-auto-senior/SKILL.md',
    '---\nname: vigilio-auto-senior\ndescription: test\n---\n# Router\n',
  );
  mk(
    '.opencode/skills/game-bevy-build/SKILL.md',
    '---\nname: game-bevy-build\ndescription: Crear videojuegos Bevy\nrouting_ecosystems: "rust"\nrouting_keywords: "videojuego,bevy,escena"\nrouting_files: "Cargo.toml"\nrouting_capabilities: "game"\n---\n# Skill\n',
  );
  r = route('Quiero crear un videojuego Bevy con escenas');
  assert.ok(
    has(r, 'game-bevy-build'),
    'new metadata skill must be discoverable without editing router',
  );
  assert.equal(r.inventory_source, 'INSTALLED');
  assert.equal(r.selected.find((s) => s.name === 'game-bevy-build').loaded, false);
  remove('.opencode');
  // Consumer initializer must support native projects in addition to Node/PHP, non-destructively.
  for (const type of ['Cargo.toml', 'CMakeLists.txt']) {
    remove('Cargo.toml');
    remove('CMakeLists.txt');
    mk(
      type,
      type === 'Cargo.toml'
        ? '[package]\nname="x"\nversion="0.1.0"\nedition="2021"'
        : 'cmake_minimum_required(VERSION 3.20)\nproject(x LANGUAGES CXX)',
    );
    const cmd = spawnSync(process.execPath, ['scripts/init-consumer.mjs', '--root', tmp], {
      cwd: packageRoot,
      encoding: 'utf8',
    });
    assert.equal(cmd.status, 0, cmd.stdout + cmd.stderr);
  }
  // Verificar lector real de skill/doc y protección de rutas.
  const loader = path.join(packageRoot, 'assets/skills/vigilio-auto-senior/scripts/read-skill.mjs');
  const evidence = spawnSync(
    process.execPath,
    [loader, '--root', tmp, '--skill', 'rust-native-build-feature'],
    { encoding: 'utf8' },
  );
  assert.equal(evidence.status, 0, evidence.stderr);
  const data = JSON.parse(evidence.stdout);
  assert.equal(data.status, 'READ_FILE_CONTENT_EMITTED');
  assert.equal(data.sha256, createHash('sha256').update(data.content).digest('hex'));
  const doc = spawnSync(
    process.execPath,
    [
      loader,
      '--root',
      tmp,
      '--skill',
      'rust-native-build-feature',
      '--reference',
      '../.vigilio-docs/stacks/rust/README.md',
    ],
    { encoding: 'utf8' },
  );
  assert.equal(doc.status, 0, doc.stderr);
  assert.ok(JSON.parse(doc.stdout).content.startsWith('# Rust'));
  const denied = spawnSync(
    process.execPath,
    [loader, '--root', tmp, '--skill', 'rust-native-build-feature', '--reference', '/etc/passwd'],
    { encoding: 'utf8' },
  );
  assert.equal(denied.status, 2);
  console.log(
    'PASS native/dynamic routing: Rust monorepo/GPUI, Qt Widgets vs WebEngine, Node monorepo, future game skills, no-project decision and installer.',
  );
} finally {
  rmSync(tmp, { recursive: true, force: true });
}
