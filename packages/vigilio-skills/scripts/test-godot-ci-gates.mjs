#!/usr/bin/env node
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { chmodSync, existsSync, mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';

const root = path.resolve(import.meta.dirname, '..');
const tpl = path.join(root, 'assets/templates/consumers/godot/scripts');
const tmp = mkdtempSync(path.join(tmpdir(), 'vigilio-godot-gates-'));
const mk = (rel, value) => {
  const f = path.join(tmp, rel);
  mkdirSync(path.dirname(f), { recursive: true });
  writeFileSync(f, value);
  return f;
};

const bashExecutable =
  process.platform === 'win32'
    ? ['C:\\Program Files\\Git\\bin\\bash.exe', 'C:\\Program Files\\Git\\usr\\bin\\bash.exe'].find(
        existsSync,
      ) || 'bash'
    : 'bash';

const cmd = (script, env = {}) => {
  const scriptPath = path.join(tpl, script).replaceAll('\\', '/');
  const envClean = { ...process.env, ...env };
  if (envClean.GODOT_BIN && typeof envClean.GODOT_BIN === 'string') {
    envClean.GODOT_BIN = envClean.GODOT_BIN.replaceAll('\\', '/');
  }
  return spawnSync(bashExecutable, [scriptPath], { cwd: tmp, env: envClean, encoding: 'utf8' });
};
try {
  let r = cmd('vigilio-godot-preflight.sh');
  assert.equal(r.status, 2, 'missing project must block');
  mk('project.godot', 'config_version=5\n');
  r = cmd('vigilio-godot-test.sh', { GODOT_BIN: '__absent_godot__' });
  assert.equal(r.status, 2, 'absent binary must block');
  r = cmd('vigilio-godot-export-gate.sh', { GODOT_BIN: '__absent_godot__' });
  assert.equal(r.status, 2, 'missing export preset must block');
  const fake = mk(
    'godot-fake',
    '#!/usr/bin/env bash\nset -e\nif [[ "$' +
      '{1:-}" == "--version" ]]; then echo 4.7.2.stable; exit 0; fi\nexit 0\n',
  );
  chmodSync(fake, 0o755);
  r = cmd('vigilio-godot-preflight.sh', { GODOT_BIN: fake, VIGILIO_GODOT_VERSION_PREFIX: '4.7.2' });
  assert.equal(r.status, 0, r.stdout + r.stderr);
  r = cmd('vigilio-godot-preflight.sh', { GODOT_BIN: fake, VIGILIO_GODOT_VERSION_PREFIX: '4.8' });
  assert.equal(r.status, 2, r.stdout + r.stderr);
  r = cmd('vigilio-godot-test.sh', { GODOT_BIN: fake });
  assert.equal(r.status, 2, 'missing required assertions should block');
  mk('tests/smoke_test.gd', 'extends SceneTree\nfunc _initialize() -> void: quit(1)\n');
  r = cmd('vigilio-godot-test.sh', { GODOT_BIN: fake });
  assert.equal(r.status, 1, 'fake exit zero without assertions must FAIL');
  r = cmd('vigilio-godot-test.sh', { GODOT_BIN: '__absent_godot__' });
  assert.equal(r.status, 2);
  // A fake Godot process exiting zero is NOT a proper E2E claim; smoke script belongs to engine.
  mk('export_presets.cfg', '[preset.0]\nname="Linux"');
  mk('stale_export.x86_64', 'old');
  r = cmd('vigilio-godot-export-gate.sh', {
    GODOT_BIN: fake,
    VIGILIO_GODOT_PRESET: 'Linux',
    VIGILIO_GODOT_ARTIFACT: 'stale_export.x86_64',
  });
  assert.equal(r.status, 2, 'preexisting artifact must block');
  r = cmd('vigilio-godot-export-gate.sh', {
    GODOT_BIN: fake,
    VIGILIO_GODOT_PRESET: 'Linux',
    VIGILIO_GODOT_ARTIFACT: 'out/game.x86_64',
  });
  assert.equal(r.status, 1, 'zero output must fail');
  console.log(
    'PASS Godot fail-closed gates: absent project, absent binary, version mismatch, missing tests, missing preset, stale and absent artifacts',
  );
} finally {
  try {
    rmSync(tmp, { recursive: true, force: true, maxRetries: 5, retryDelay: 100 });
  } catch {}
}
