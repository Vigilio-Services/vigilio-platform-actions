#!/usr/bin/env node
// Source-level integrity only: not Godot parser or gameplay E2E.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const monorepoDocs = path.resolve(import.meta.dirname, '../../../../vigilio-docs/examples');
const siblingDocs = path.resolve(import.meta.dirname, '../../vigilio-docs/examples');
const root = fs.existsSync(monorepoDocs) ? monorepoDocs : siblingDocs;
function inspectGame(name) {
  const p = path.join(root, name);
  assert.ok(fs.existsSync(path.join(p, 'project.godot')));
  const files = [];
  const walk = (dir) => {
    for (const x of fs.readdirSync(dir, { withFileTypes: true })) {
      const f = path.join(dir, x.name);
      if (x.isDirectory()) walk(f);
      else if (x.isFile() && /\.(?:tscn|gd|godot)$/.test(x.name)) files.push(f);
    }
  };
  walk(p);
  let resourceRefs = 0;
  for (const f of files) {
    const raw = fs.readFileSync(f, 'utf8');
    for (const m of raw.matchAll(/res:\/\/([^"'\s\n\r]+\.(?:tscn|gd|wav|tres|png|jpg))/g)) {
      const pathInGame = path.resolve(p, m[1]);
      assert.ok(
        pathInGame.startsWith(p + path.sep) && fs.existsSync(pathInGame),
        `${name}: missing resource ${m[1]}`,
      );
      resourceRefs++;
    }
  }
  const test = fs.readFileSync(path.join(p, 'tests/smoke_test.gd'), 'utf8');
  assert.match(test, /checks\s*\+=\s*1/);
  assert.match(test, /quit\(1\)/);
  assert.match(test, /assertions=/);
  return { scenes: files.filter((x) => x.endsWith('.tscn')).length, resourceRefs };
}
const a = inspectGame('godot-2d-jump-audio');
const b = inspectGame('godot-3d-movement-golden-path');
assert.ok(a.scenes >= 2 && a.resourceRefs >= 2);
assert.ok(b.scenes >= 1 && b.resourceRefs >= 1);
console.log(
  `PASS Godot source references: 2D scenes=${a.scenes}, 3D scenes=${b.scenes}, verified refs=${a.resourceRefs + b.resourceRefs}; GODOT_RUNTIME=NOT_RUN GAMEPLAY_E2E=NOT_RUN`,
);
