#!/usr/bin/env node
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import fs, { chmodSync, mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';

const root = path.resolve(import.meta.dirname, '..');
const router = path.join(root, 'assets/skills/vigilio-auto-senior/scripts/route-skills.mjs');
const cpp = path.join(root, 'assets/templates/consumers/cpp');
const rust = path.join(root, 'assets/templates/consumers/rust');
const tmp = mkdtempSync(path.join(tmpdir(), 'vigilio-hardening-'));
const mk = (rel, data) => {
  const file = path.join(tmp, rel);
  mkdirSync(path.dirname(file), { recursive: true });
  writeFileSync(file, data);
  return file;
};

const bashExecutable =
  process.platform === 'win32'
    ? ['C:\\Program Files\\Git\\bin\\bash.exe', 'C:\\Program Files\\Git\\usr\\bin\\bash.exe'].find(
        fs.existsSync,
      ) || 'bash'
    : 'bash';
const pythonExecutable = process.platform === 'win32' ? 'python' : 'python3';

const cmd = (exec, args, opts = {}) => {
  let runExec = exec;
  let runArgs = args;
  if (exec === 'bash') {
    runExec = bashExecutable;
    runArgs = args.map((arg) => (typeof arg === 'string' ? arg.replaceAll('\\', '/') : arg));
  } else if (exec === 'python3') {
    runExec = pythonExecutable;
  }
  return spawnSync(runExec, runArgs, { cwd: tmp, encoding: 'utf8', ...opts });
};
const route = (task, extra = []) => {
  const r = cmd(process.execPath, [router, '--root', tmp, '--task', task, ...extra]);
  assert.equal(r.status, 0, r.stderr);
  return JSON.parse(r.stdout);
};
const has = (j, name) => j.selected.some((x) => x.name === name);
try {
  // C-only projects MUST NOT receive C++ skills.
  mk(
    'CMakeLists.txt',
    'cmake_minimum_required(VERSION 3.21)\nproject(pure_c LANGUAGES C)\nadd_executable(main src/main.c)\n',
  );
  mk('src/main.c', 'int main(void){return 0;}\n');
  let r = route('Quiero mejorar este programa C');
  assert.equal(r.detected.cpp, false);
  assert.equal(r.detected.c, true);
  assert.ok(!has(r, 'cpp-native-build-feature'), 'C-only misrouted to C++');
  // Native preflight respects VIGILIO_NATIVE_MODE, not legacy inconsistent names.
  let pre = cmd('bash', [path.join(cpp, 'scripts/vigilio-native-preflight.sh')], {
    env: { ...process.env, VIGILIO_NATIVE_MODE: 'rust' },
  });
  assert.equal(pre.status, 2, pre.stdout + pre.stderr);
  pre = cmd('bash', [path.join(rust, 'scripts/vigilio-native-preflight.sh')], {
    env: { ...process.env, VIGILIO_NATIVE_MODE: 'cpp' },
  });
  assert.equal(pre.status, 2, pre.stdout + pre.stderr);
  rmSync(path.join(tmp, 'CMakeLists.txt'));
  rmSync(path.join(tmp, 'src'), { recursive: true });
  mk('Cargo.toml', '[package]\nname="mixed"\nversion="0.1.0"\nedition="2021"\n');
  mk('CMakeLists.txt', 'cmake_minimum_required(VERSION 3.21)\nproject(mixed LANGUAGES CXX)\n');
  r = route('Crear endpoint Rust con Axum');
  assert.ok(has(r, 'rust-native-build-feature'), 'expected Rust skill');
  assert.ok(!has(r, 'cpp-native-build-feature'), 'Rust task selected unrelated C++');
  r = route('Crear feature nueva');
  assert.equal(r.decision_required, true, 'mixed repo must ask module/language');
  assert.ok(!has(r, 'cpp-native-build-feature') && !has(r, 'rust-native-build-feature'));
  mk('apps/rust/Cargo.toml', '[package]\nname="api"\nversion="0.1.0"\nedition="2021"\n');
  r = route('Crear endpoint', ['--scope', 'apps/rust']);
  assert.equal(r.detected.cpp, false);
  assert.ok(has(r, 'rust-native-build-feature'));
  r = cmd(process.execPath, [router, '--root', tmp, '--scope', '/etc', '--task', 'feature']);
  assert.equal(r.status, 2, '--scope escaped project root');
  rmSync(path.join(tmp, 'Cargo.toml'));
  rmSync(path.join(tmp, 'CMakeLists.txt'));
  rmSync(path.join(tmp, 'apps'), { recursive: true });
  mk(
    '.opencode/skills/game-bevy-build/SKILL.md',
    '---\nname: game-bevy-build\ndescription: Creación de videojuegos Bevy\nrouting_ecosystems: "rust"\nrouting_keywords: "videojuego,bevy,escena"\nrouting_capabilities: "game"\n---\n# Skill\n',
  );
  r = route('Quiero crear un videojuego Bevy');
  assert.equal(r.project_found, false);
  assert.equal(r.decision_required, true);
  assert.ok(
    has(r, 'game-bevy-build'),
    'new stack without project must surface relevant installed skill',
  );
  assert.ok(!has(r, 'rust-native-build-feature'), 'do not impose Rust implementation without repo');
  rmSync(path.join(tmp, '.opencode'), { recursive: true });
  // Real CMake discovery: BrowserE2E case-sensitive bug must fail closed on zero matching.
  mk(
    'CMakeLists.txt',
    'cmake_minimum_required(VERSION 3.21)\nproject(test LANGUAGES CXX)\nenable_testing()\nadd_test(NAME BrowserE2E COMMAND $' +
      '{CMAKE_COMMAND} -E true)\n',
  );
  const hasCmake =
    spawnSync(process.platform === 'win32' ? 'where.exe' : 'which', ['cmake']).status === 0;
  if (hasCmake) {
    const configured = cmd('cmake', ['-S', '.', '-B', 'build']);
    assert.equal(configured.status, 0, configured.stdout + configured.stderr);
    let ct = cmd('python3', [
      path.join(cpp, 'scripts/vigilio-ctest-required.py'),
      '--build',
      'build',
      '--name-pattern',
      'browser.*e2e',
    ]);
    assert.equal(ct.status, 0, ct.stdout + ct.stderr);
    ct = cmd('python3', [
      path.join(cpp, 'scripts/vigilio-ctest-required.py'),
      '--build',
      'build',
      '--name-pattern',
      'nonexistent-e2e',
    ]);
    assert.equal(ct.status, 2, ct.stdout + ct.stderr);
  } else {
    // If cmake is not present on host, test fail-closed behavior on missing directory directly
    const ct = cmd('python3', [
      path.join(cpp, 'scripts/vigilio-ctest-required.py'),
      '--build',
      'build',
      '--name-pattern',
      'browser.*e2e',
    ]);
    assert.equal(ct.status, 2, ct.stdout + ct.stderr);
  }
  // Release MUST block missing artifact and missing consumer signing/install implementation.
  const gate = path.join(cpp, 'scripts/vigilio-release-gate.sh');
  let rel = cmd('bash', [gate]);
  assert.equal(rel.status, 2, 'no artifacts should block release');
  mk('fake-app', '#!/usr/bin/env bash\nexit 0\n');
  chmodSync(path.join(tmp, 'fake-app'), 0o755);
  mk('package.tar.gz', 'package-example');
  mk('sbom.json', '{"components":[]}');
  mk('licenses.json', '{"licenses":[]}');
  // Even if artifacts exist, missing checksum/signature/smoke must block.
  rel = cmd('bash', [gate], {
    env: {
      ...process.env,
      VIGILIO_NATIVE_BINARY: path.join(tmp, 'fake-app'),
      VIGILIO_NATIVE_PACKAGE: path.join(tmp, 'package.tar.gz'),
      VIGILIO_SBOM_FILE: path.join(tmp, 'sbom.json'),
      VIGILIO_LICENSE_REPORT: path.join(tmp, 'licenses.json'),
    },
  });
  assert.equal(rel.status, 2, 'release passed without checksum/signature/smoke');
  console.log(
    'PASS negative native gates: C-only, mixed scope, no-repo Bevy, preflight, exact CTest and release fail-closed',
  );
} finally {
  try {
    rmSync(tmp, { recursive: true, force: true, maxRetries: 5, retryDelay: 100 });
  } catch {}
}
