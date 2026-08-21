import { cp, mkdir, readdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import {
  isMap,
  isScalar,
  isSeq,
  type Node,
  type Pair,
  parseDocument,
  type YAMLMap,
  type YAMLSeq,
} from 'yaml';
import { normalizePromptPack } from './normalizer.js';
import { validatePackShape } from './validator.js';

const SKILL_KEYS = new Set(['primary', 'supporting', 'conditional']);
type AnyMap = YAMLMap<unknown, unknown>;

function pairKey(pair: Pair<unknown, unknown>) {
  if (typeof pair.key === 'string') return pair.key;
  return isScalar(pair.key) && typeof pair.key.value === 'string' ? pair.key.value : undefined;
}

function mapAt(map: AnyMap, key: string): AnyMap | undefined {
  const value = map.get(key, true);
  return isMap(value) ? (value as AnyMap) : undefined;
}

function ensureMap(document: ReturnType<typeof parseDocument>, map: AnyMap, key: string) {
  const current = mapAt(map, key);
  if (current) return current;
  const created = document.createNode({});
  if (!isMap(created)) throw new Error(`Unable to create YAML map for ${key}`);
  map.set(key, created);
  return created as AnyMap;
}

function normalizeRuleNode(document: ReturnType<typeof parseDocument>, rule: AnyMap) {
  const when = ensureMap(document, rule, 'when');
  const predicates = when.get('predicates', true);
  const predicateList = (
    isSeq(predicates) ? predicates : document.createNode([])
  ) as YAMLSeq<unknown>;
  if (!isSeq(predicateList)) throw new Error('Unable to create predicate list');
  const remove: number[] = [];

  rule.items.forEach((pair, index) => {
    const key = pairKey(pair);
    if (!key || key === 'when') return;
    if (key === 'when_document_exists') {
      when.set('document_exists', pair.value as Node);
      remove.push(index);
      return;
    }
    if (key === 'when_change_touches') {
      when.set('change_touches', pair.value as Node);
      remove.push(index);
      return;
    }
    if (!key.startsWith('when_') || !isScalar(pair.value)) return;
    if (typeof pair.value.value !== 'boolean') return;
    predicateList.add(
      document.createNode({
        name: key.slice('when_'.length).toLowerCase(),
        equals: pair.value.value,
      }),
    );
    remove.push(index);
  });

  for (const index of remove.toReversed()) rule.items.splice(index, 1);
  if (predicateList.items.length > 0) when.set('predicates', predicateList);
  if (when.items.length === 0) {
    rule.delete('when');
    return;
  }
  const whenIndex = rule.items.findIndex((pair) => pairKey(pair) === 'when');
  if (whenIndex > 0) {
    const [whenPair] = rule.items.splice(whenIndex, 1);
    if (whenPair) rule.items.unshift(whenPair);
  }
}

function normalizeConditionalMap(
  document: ReturnType<typeof parseDocument>,
  conditional: AnyMap | undefined,
) {
  if (!conditional) return;
  for (const pair of conditional.items) {
    if (isMap(pair.value)) normalizeRuleNode(document, pair.value);
  }
}

function migrateSkills(document: ReturnType<typeof parseDocument>, root: AnyMap) {
  const value = root.get('skills', true);
  if (isSeq(value)) {
    const canonical = document.createNode({});
    if (!isMap(canonical)) throw new Error('Unable to create canonical skills map');
    const canonicalMap = canonical as AnyMap;
    canonicalMap.set('primary', value);
    root.set('skills', canonicalMap);
  }
  const skills = mapAt(root, 'skills');
  if (!skills) return;
  const direct = skills.items.filter((pair) => {
    const key = pairKey(pair);
    return key !== undefined && !SKILL_KEYS.has(key);
  });
  if (direct.length > 0) {
    const conditional = ensureMap(document, skills, 'conditional');
    for (const pair of direct) {
      const key = pairKey(pair);
      if (!key) continue;
      if (conditional.has(key)) throw new Error(`Duplicate conditional skill group: ${key}`);
      conditional.items.push(pair);
      const index = skills.items.indexOf(pair);
      if (index >= 0) skills.items.splice(index, 1);
    }
  }
  normalizeConditionalMap(document, mapAt(skills, 'conditional'));
}

function migrateQualityGates(document: ReturnType<typeof parseDocument>, root: AnyMap) {
  const value = root.get('quality_gates', true);
  if (isSeq(value)) {
    const canonical = document.createNode({});
    if (!isMap(canonical)) throw new Error('Unable to create canonical quality-gates map');
    const canonicalMap = canonical as AnyMap;
    canonicalMap.set('required', value);
    root.set('quality_gates', canonicalMap);
  }
  const gates = mapAt(root, 'quality_gates');
  if (!gates) return;
  normalizeConditionalMap(document, mapAt(gates, 'conditional'));
}

function migrateDocuments(document: ReturnType<typeof parseDocument>, root: AnyMap) {
  const value = root.get('documents', true);
  if (!isSeq(value)) return;
  const canonical = document.createNode({});
  if (!isMap(canonical)) throw new Error('Unable to create canonical documents map');
  const canonicalMap = canonical as AnyMap;
  canonicalMap.set('required', value);
  root.set('documents', canonicalMap);
}

function migrateOpenSpec(document: ReturnType<typeof parseDocument>, root: AnyMap) {
  const openspec = mapAt(root, 'openspec');
  if (!openspec?.has('capability')) return;
  const capability = openspec.get('capability', true);
  const current = openspec.get('capabilities', true);
  const capabilities = (isSeq(current) ? current : document.createNode([])) as YAMLSeq<unknown>;
  if (!isSeq(capabilities)) throw new Error('Unable to create OpenSpec capabilities list');
  if (capability !== undefined) capabilities.items.unshift(capability as Node);
  openspec.set('capabilities', capabilities);
  openspec.delete('capability');
}

function migrateScope(document: ReturnType<typeof parseDocument>, root: AnyMap) {
  const allowed = root.get('allowed_code_paths', true);
  const forbidden = root.get('forbidden_code_paths', true);
  if (allowed === undefined && forbidden === undefined) return;
  const scope = ensureMap(document, root, 'scope');
  if (!scope.has('allowed_paths') && allowed !== undefined) scope.set('allowed_paths', allowed);
  if (!scope.has('forbidden_paths') && forbidden !== undefined) {
    scope.set('forbidden_paths', forbidden);
  }
  root.delete('allowed_code_paths');
  root.delete('forbidden_code_paths');
}

function migrateLegacyStringList(
  document: ReturnType<typeof parseDocument>,
  root: AnyMap,
  key: string,
) {
  const value = root.get(key, true);
  if (!isSeq(value)) return;
  value.items = value.items.map((item) => {
    if (!isMap(item) || item.items.length !== 1) return item;
    const pair = item.items[0];
    if (!pair) return item;
    const name = pairKey(pair);
    if (!name || !isScalar(pair.value) || typeof pair.value.value !== 'string') return item;
    return document.createNode(`${name}: ${pair.value.value}`);
  });
}

export function migratePromptPackSource(source: string, sourceName = 'prompt-pack.yaml') {
  const document = parseDocument(source, { keepSourceTokens: true });
  if (document.errors.length > 0) {
    throw new Error(
      `Invalid YAML at ${sourceName}: ${document.errors.map((error) => error.message).join('; ')}`,
    );
  }
  if (!isMap(document.contents)) throw new Error(`Prompt pack must be a YAML map: ${sourceName}`);
  const root = document.contents as AnyMap;

  if (!root.has('schema_version')) {
    const versionIndex = root.items.findIndex((pair) => pairKey(pair) === 'version');
    root.items.splice(
      versionIndex >= 0 ? versionIndex + 1 : 0,
      0,
      document.createPair('schema_version', 2),
    );
  } else {
    root.set('schema_version', 2);
  }

  migrateSkills(document, root);
  migrateQualityGates(document, root);
  migrateDocuments(document, root);
  migrateOpenSpec(document, root);
  migrateScope(document, root);
  migrateLegacyStringList(document, root, 'activation_requirements');
  migrateLegacyStringList(document, root, 'documentation_sync');
  const output = document.toString({ lineWidth: 0 });
  return { output, changed: output !== source };
}

async function findPromptPacks(root: string): Promise<string[]> {
  const entries = await readdir(root, { withFileTypes: true });
  const nested = await Promise.all(
    entries.map(async (entry) => {
      const target = path.join(root, entry.name);
      if (entry.isDirectory()) return findPromptPacks(target);
      return entry.isFile() && entry.name === 'prompt-pack.yaml' ? [target] : [];
    }),
  );
  return nested.flat().sort((left, right) => left.localeCompare(right));
}

export async function migratePromptPacks(input: {
  rulesRoot: string;
  write: boolean;
  backupRoot?: string | undefined;
}) {
  if (input.write && !input.backupRoot) {
    throw new Error('A backup directory is required when migration writes are enabled');
  }
  const files = await findPromptPacks(input.rulesRoot);
  const migrations: Array<{ file: string; output: string }> = [];
  for (const file of files) {
    const source = await readFile(file, 'utf8');
    const migrated = migratePromptPackSource(source, file);
    const normalized = normalizePromptPack(parseDocument(migrated.output).toJS()).manifest;
    if (!normalized.id.includes('__')) await validatePackShape(normalized, file);
    if (!migrated.changed) continue;
    migrations.push({ file, output: migrated.output });
  }

  // Validation completes for every pack before the first source file changes.
  // Backups also complete first, so a later write failure remains recoverable.
  if (input.write && input.backupRoot) {
    for (const migration of migrations) {
      const file = migration.file;
      const relative = path.relative(input.rulesRoot, file);
      const backup = path.join(input.backupRoot, relative);
      await mkdir(path.dirname(backup), { recursive: true });
      await cp(file, backup, { errorOnExist: true });
    }
    for (const migration of migrations) {
      await writeFile(migration.file, migration.output, 'utf8');
    }
  }
  const changed = migrations.map((migration) => migration.file);
  return { scanned: files.length, changed, written: input.write ? changed.length : 0 };
}
