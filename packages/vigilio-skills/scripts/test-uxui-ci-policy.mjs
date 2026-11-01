#!/usr/bin/env node
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import path from 'node:path';

const base = path.resolve(import.meta.dirname, '../assets/templates/consumers/uxui');
const content = readFileSync(path.join(base, '.github/workflows/uxui-pr.example.yml'), 'utf8');
assert.match(content, /VIGILIO_UXUI_TOKENS_PATH/);
assert.match(content, /BLOCKED: product tokens not found/);
assert.match(content, /BLOCKED: example is not consumer design evidence/);
assert.doesNotMatch(content, /run:\s*node .*--file tokens\.example\.json/);
assert.match(content, /node tests\/uxui-gate\.test\.mjs/);
console.log(
  'PASS UX/UI CI template policy: consumer tokens required; no example-only green. ACTUAL_CONSUMER_CI=NOT_RUN',
);
