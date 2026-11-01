#!/usr/bin/env node
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve(import.meta.dirname, '..');
const assets = path.join(root, 'assets');
const skills = path.join(assets, 'skills');
const docs = path.join(assets, 'docs');
const manifest = JSON.parse(fs.readFileSync(path.join(assets, 'docs-manifest.json'), 'utf8'));
let checked = 0;
const failures = [];
const sha256 = (b) => crypto.createHash('sha256').update(b).digest('hex');
for (const [rel, digest] of Object.entries(manifest.documents)) {
  const filename = path.join(docs, rel);
  if (!fs.existsSync(filename) || sha256(fs.readFileSync(filename)) !== digest)
    failures.push(`Snapshot mismatch: ${rel}`);
  checked++;
}
function* mdFiles(dir) {
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    const f = path.join(dir, ent.name);
    if (ent.isDirectory()) yield* mdFiles(f);
    if (ent.isFile() && f.endsWith('.md')) yield f;
  }
}
const localLink = /\]\(([^)]+)\)/g;
for (const filename of mdFiles(skills)) {
  const raw = fs.readFileSync(filename, 'utf8');
  const md = raw.replace(/^```[^\n]*\n[\s\S]*?^```[ \t]*$/gm, '');
  for (const match of md.matchAll(localLink)) {
    const href = match[1].split('#')[0];
    if (!href || /^(?:https?:|mailto:|#)/.test(href)) continue;
    const destination = path.resolve(
      path.dirname(filename),
      href.replace('/.vigilio-docs/', '/../docs/'),
    );
    // Projection from isolated consumer: <skills>/.vigilio-docs -> package assets/docs.
    const local = path.resolve(path.dirname(filename), href);
    const rel = path.relative(skills, local).replaceAll(path.sep, '/');
    const target = rel.startsWith('.vigilio-docs/')
      ? path.join(docs, rel.slice('.vigilio-docs/'.length))
      : destination;
    if (!fs.existsSync(target)) failures.push(`${path.relative(skills, filename)} -> ${href}`);
  }
}

const platformContracts = [
  'aws-platform-foundation/references/canonical-contract.md',
  'kubernetes-gitops-delivery/references/canonical-contract.md',
  'kubernetes-policy-runtime-security/references/canonical-contract.md',
  'onprem-kubernetes-foundation/references/canonical-contract.md',
  'platform-cicd-factory/references/canonical-contract.md',
  'platform-data-reliability/references/canonical-contract.md',
  'platform-environment-promotion/references/canonical-contract.md',
  'platform-finops/references/canonical-contract.md',
  'platform-local-production-lab/references/canonical-contract.md',
  'platform-observability-sre/references/observability-contract.md',
  'platform-repository-workspace/references/canonical-contract.md',
  'platform-resilience-disaster-recovery/references/canonical-contract.md',
  'platform-scalability-capacity/references/canonical-contract.md',
  'platform-validation-evidence/references/canonical-contract.md',
  'software-supply-chain-security/references/canonical-contract.md',
  'terraform-iac-delivery/references/canonical-contract.md',
];
const commonContract = '../../.vigilio-docs/standards/platform/common-operational-contract.md';
const duplicatedCommonText = [
  'Hashes criptográficos y firmas validadas.',
  'Arquitectura | Declarativa y auditable | Imperativa y opaca',
  'no reescribir masivamente código heredado',
];

for (const relativeContract of platformContracts) {
  const contractPath = path.join(skills, relativeContract);
  if (!fs.existsSync(contractPath)) {
    failures.push(`Missing platform contract: ${relativeContract}`);
    continue;
  }
  const contract = fs.readFileSync(contractPath, 'utf8');
  if (!contract.includes(commonContract)) {
    failures.push(`Platform contract does not reference shared policy: ${relativeContract}`);
  }
  for (const duplicate of duplicatedCommonText) {
    if (contract.includes(duplicate)) {
      failures.push(
        `Platform contract duplicates shared policy (${duplicate}): ${relativeContract}`,
      );
    }
  }
}

for (const requiredDoc of [
  'standards/platform/common-operational-contract.md',
  'standards/platform/platform-context.md',
  'schemas/platform-context.schema.json',
]) {
  if (!fs.existsSync(path.join(docs, requiredDoc))) {
    failures.push(`Missing bundled platform document: ${requiredDoc}`);
  }
}

const platformContextTemplate = path.join(
  assets,
  'templates',
  'project',
  '.vigilio',
  'platform-context.yaml',
);
if (!fs.existsSync(platformContextTemplate)) {
  failures.push('Missing consumer template: templates/project/.vigilio/platform-context.yaml');
}

if (failures.length) {
  console.error(failures.join('\n'));
  process.exitCode = 1;
} else console.log(`Bundled docs verified: ${checked} files, all local skill links resolve.`);
