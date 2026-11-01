#!/usr/bin/env node
/** Prevent token-hygiene docs from freezing skill counts and Godot demos from regressing to unit-only smoke. */
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const monorepoDocs = path.resolve(import.meta.dirname, '../../../../vigilio-docs');
const siblingDocs = path.resolve(import.meta.dirname, '../../vigilio-docs');
const rootDocs = fs.existsSync(monorepoDocs) ? monorepoDocs : siblingDocs;
const assetsDir = path.resolve(import.meta.dirname, '../assets');

const docFiles = [
  path.join(rootDocs, 'standards/ai/adaptive-context-budget-and-evidence.md'),
  path.join(rootDocs, 'standards/ai/dynamic-capability-discovery.md'),
  path.join(assetsDir, 'skills/adaptive-context-budget/SKILL.md'),
];
let assertions = 0;
for (const file of docFiles) {
  const source = fs.readFileSync(file, 'utf8');
  assert.doesNotMatch(
    source,
    /(?:abrir|leer|cargar|metadata de|metadatos de|cat[aá]logo de)\s+(?:las|todas las)?\s*\d+\s+skills/i,
    `${file}: no congelar el tamaño del catálogo de skills`,
  );
  assert.match(source, /cat[aá]logo/i);
  assertions += 2;
}
for (const [p, script, required] of [
  [
    'godot-2d-jump-audio',
    'tests/smoke_test.gd',
    [
      'world_scene.instantiate()',
      'CollisionShape2D',
      'AudioStreamPlayer2D',
      'player.jumped.emit()',
      'checks += 1',
    ],
  ],
  [
    'godot-3d-movement-golden-path',
    'tests/smoke_test.gd',
    ['world_scene.instantiate()', 'CollisionShape3D', 'Camera3D', 'checks += 1'],
  ],
]) {
  const content = fs.readFileSync(path.join(rootDocs, 'examples', p, script), 'utf8');
  for (const requiredFragment of required) {
    assert.ok(content.includes(requiredFragment), `${p}: missing ${requiredFragment}`);
    assertions++;
  }
  assert.match(content, /quit\(1\)/);
  assertions++;
}
console.log(`PASS canonical-doc-completeness assertions=${assertions}`);
