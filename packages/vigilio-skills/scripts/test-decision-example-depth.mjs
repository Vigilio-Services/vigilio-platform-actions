#!/usr/bin/env node
/** Quality gate for the domain-specific Correcto/Incorrecto examples.
 * Checks canonicals, not their generated snapshots. No claims about executable E2E.
 */
import fs from 'node:fs';
import path from 'node:path';

const monorepoDocs = path.resolve(import.meta.dirname, '../../../../vigilio-docs');
const siblingDocs = path.resolve(import.meta.dirname, '../../vigilio-docs');
const root = fs.existsSync(monorepoDocs) ? monorepoDocs : siblingDocs;
const areas = [
  'stacks/rust',
  'stacks/cpp',
  'stacks/godot',
  'standards/experience',
  'stacks/frontend/web-mfe/ui',
  'stacks/mobile/expo/ui',
];
const foundations = [
  'foundations/architecture/solid.md',
  'foundations/architecture/cqrs.md',
  'foundations/architecture/ddd.md',
  'foundations/architecture/clean-architecture.md',
  'foundations/architecture/hexagonal.md',
  'foundations/architecture/dry.md',
  'foundations/engineering/code-quality.md',
  'governance/documentation-dry-and-ownership.md',
  'standards/engineering/naming-and-boundaries.md',
  'standards/engineering/code-comments-and-docstrings.md',
];
const files = foundations.slice();
for (const area of areas) {
  const start = path.join(root, area);
  if (!fs.existsSync(start)) throw new Error(`Missing canonical section: ${area}`);
  const walk = (dir) => {
    for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, ent.name);
      if (ent.isDirectory()) walk(full);
      else if (ent.isFile() && ent.name.endsWith('.md'))
        files.push(path.relative(root, full).replaceAll(path.sep, '/'));
    }
  };
  walk(start);
}
const violations = [];
let examples = 0;
for (const rel of files) {
  const source = fs.readFileSync(path.join(root, rel), 'utf8');
  const correct = (source.match(/^- \*\*✅ Correcto\*\*: .+$/gm) || []).length;
  const incorrect = (source.match(/^- \*\*❌ Incorrecto\*\*: .+$/gm) || []).length;
  const min = rel.startsWith('foundations/architecture/') ? 10 : 5;
  if (correct < min || incorrect < min)
    violations.push(`${rel}: correct=${correct} incorrect=${incorrect}, min=${min}`);
  if (!source.startsWith('# ')) violations.push(`${rel}: missing H1`);
  if ((source.match(/^```/gm) || []).length % 2) violations.push(`${rel}: uneven fences`);
  const rows = [...source.matchAll(/^- \*\*❌ Incorrecto\*\*: (.+)$/gm)].map((m) => m[1].trim());
  if (new Set(rows).size !== rows.length) violations.push(`${rel}: duplicated bad cases`);
  if (source.includes('provocar el caso incorrecto en un test o revisión del consumidor'))
    violations.push(`${rel}: generic example placeholder`);
  examples += Math.min(correct, incorrect);
}
if (violations.length) {
  console.error(`FAIL decision-example-depth\n${violations.join('\n')}`);
  process.exit(1);
}
console.log(
  `PASS decision-example-depth: ${files.length} canonical documents, at least ${examples} Correcto/Incorrecto pairs`,
);
