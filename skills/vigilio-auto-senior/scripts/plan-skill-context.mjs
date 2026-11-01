#!/usr/bin/env node
import crypto from 'node:crypto';
/** Creates a minimal, evidence-driven reading order from router JSON; NEVER marks files loaded. */
import fs from 'node:fs';
import path from 'node:path';

const args = process.argv.slice(2);
function opt(k, d) {
  const i = args.indexOf(k);
  return i < 0 ? d : args[i + 1];
}
const route = opt('--routing', '');
const maxBytes = Number(opt('--budget-bytes', '150000'));
const skillsRoot = path.resolve(opt('--skills-root', path.resolve(import.meta.dirname, '../..')));
let realSkillsRoot;
try {
  realSkillsRoot = fs.realpathSync(skillsRoot);
} catch {
  console.error('BLOCKED skills root missing');
  process.exit(2);
}
if (!route || !Number.isSafeInteger(maxBytes) || maxBytes < 512) {
  console.error('BLOCKED invalid --routing/--budget-bytes');
  process.exit(2);
}
let parsed;
try {
  const stat = fs.statSync(route);
  if (!stat.isFile() || stat.size > 2 * 1024 * 1024) throw Error('routing file too large');
  parsed = JSON.parse(fs.readFileSync(route, 'utf8'));
} catch (e) {
  console.error(`BLOCKED routing JSON: ${e.message}`);
  process.exit(2);
}
if (
  parsed.state !== 'PROPOSED_NOT_LOADED' ||
  !Array.isArray(parsed.selected) ||
  parsed.selected.length > 150
) {
  console.error('BLOCKED: routing results not a proposal');
  process.exit(2);
}
const seen = new Set(),
  plan = [];
let total = 0;
for (const sel of parsed.selected) {
  if (
    typeof sel.name !== 'string' ||
    !/^[a-z][a-z0-9-]*$/.test(sel.name) ||
    typeof sel.source !== 'string'
  ) {
    console.error('BLOCKED malformed skill entry');
    process.exit(2);
  }
  const input = path.resolve(sel.source);
  // Restrict absolute sources to trusted original routing files only; never read arbitrary source paths.
  if (
    path.basename(input) !== 'SKILL.md' ||
    path.basename(path.dirname(input)) !== sel.name ||
    !fs.existsSync(input)
  ) {
    console.error(`BLOCKED invalid skill path ${sel.name}`);
    process.exit(2);
  }
  if (seen.has(sel.name)) continue;
  seen.add(sel.name);
  const realInput = fs.realpathSync(input);
  if (realInput !== path.join(realSkillsRoot, sel.name, 'SKILL.md')) {
    console.error('BLOCKED skill escapes authorized root');
    process.exit(2);
  }
  const stat = fs.lstatSync(input);
  if (stat.isSymbolicLink() || !stat.isFile() || stat.size > 256 * 1024) {
    console.error(`BLOCKED large or symlink skill ${sel.name}`);
    process.exit(2);
  }
  const content = fs.readFileSync(input);
  const sha256 = crypto.createHash('sha256').update(content).digest('hex');
  total += stat.size;
  plan.push({
    skill: sel.name,
    bytes: stat.size,
    sha256,
    reason: sel.reason ?? '',
    status: 'PROPOSED_NOT_LOADED',
    required_action: 'READ_FULL_SKILL_AND_APPLICABLE_REFERENCES',
  });
}
const result = {
  status: total > maxBytes ? 'BLOCKED_BUDGET_REVIEW' : 'PLAN_ONLY',
  budget_bytes: maxBytes,
  mandatory_skill_bytes: total,
  estimated_tokens_heuristic: Math.ceil(total / 3.5),
  count: plan.length,
  read_order: plan,
  note: 'Plan reads bytes for hashing locally, NOT a model read. Never truncate selected SKILL.md; increase budget or refine selected set, then read full files.',
};
console.log(JSON.stringify(result, null, 2));
if (total > maxBytes) process.exit(3);
