import type {
  ConditionPredicate,
  PromptPack,
  QualityGateConfiguration,
  RuleCondition,
  SkillConfiguration,
} from './types.js';

type UnknownRecord = Record<string, unknown>;

export type NormalizedPromptPack = {
  manifest: PromptPack;
  migrated: boolean;
};

const LEGACY_RULE_KEYS = new Set(['when_document_exists', 'when_change_touches']);
const SKILL_CONFIGURATION_KEYS = new Set(['primary', 'supporting', 'conditional']);

function isRecord(value: unknown): value is UnknownRecord {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function cloneRecord(value: UnknownRecord): UnknownRecord {
  return structuredClone(value);
}

function normalizeConditionRule(ruleValue: unknown) {
  if (!isRecord(ruleValue)) return ruleValue;
  const rule = cloneRecord(ruleValue);
  const existingWhen = isRecord(rule['when']) ? cloneRecord(rule['when']) : {};
  const predicates = Array.isArray(existingWhen['predicates'])
    ? structuredClone(existingWhen['predicates'])
    : [];
  let changed = false;

  if ('when_document_exists' in rule) {
    existingWhen['document_exists'] = rule['when_document_exists'];
    delete rule['when_document_exists'];
    changed = true;
  }
  if ('when_change_touches' in rule) {
    existingWhen['change_touches'] = rule['when_change_touches'];
    delete rule['when_change_touches'];
    changed = true;
  }

  for (const [key, value] of Object.entries(rule)) {
    if (!key.startsWith('when_') || LEGACY_RULE_KEYS.has(key) || typeof value !== 'boolean') {
      continue;
    }
    const predicate: ConditionPredicate = {
      name: key.slice('when_'.length).toLowerCase(),
      equals: value,
    };
    predicates.push(predicate);
    delete rule[key];
    changed = true;
  }

  if (predicates.length > 0) existingWhen['predicates'] = predicates;
  if (changed || Object.keys(existingWhen).length > 0) rule['when'] = existingWhen;
  return rule;
}

function normalizeConditionalRules(value: unknown) {
  if (!isRecord(value)) return value;
  return Object.fromEntries(
    Object.entries(value).map(([name, rule]) => [name, normalizeConditionRule(rule)]),
  );
}

function normalizeSkills(value: unknown): SkillConfiguration | unknown {
  if (Array.isArray(value)) return { primary: value };
  if (!isRecord(value)) return value;

  const skills = cloneRecord(value);
  const directRules = Object.entries(skills).filter(([key]) => !SKILL_CONFIGURATION_KEYS.has(key));
  const conditional = isRecord(skills['conditional']) ? cloneRecord(skills['conditional']) : {};
  for (const [name, rule] of directRules) {
    conditional[name] = rule;
    delete skills[name];
  }
  if (Object.keys(conditional).length > 0) {
    skills['conditional'] = normalizeConditionalRules(conditional);
  }
  return skills as SkillConfiguration;
}

function normalizeQualityGates(value: unknown): QualityGateConfiguration | unknown {
  if (Array.isArray(value)) return { required: value };
  if (!isRecord(value)) return value;
  const gates = cloneRecord(value);
  if ('conditional' in gates) {
    gates['conditional'] = normalizeConditionalRules(gates['conditional']);
  }
  return gates as QualityGateConfiguration;
}

function normalizeDocuments(value: unknown) {
  return Array.isArray(value) ? { required: value } : value;
}

function normalizeLegacyStringList(value: unknown) {
  if (!Array.isArray(value)) return value;
  return value.map((item) => {
    if (!isRecord(item)) return item;
    const entries = Object.entries(item);
    if (entries.length !== 1) return item;
    const [entry] = entries;
    if (!entry || typeof entry[1] !== 'string') return item;
    return `${entry[0]}: ${entry[1]}`;
  });
}

function normalizeOpenSpec(value: unknown) {
  if (!isRecord(value) || typeof value['capability'] !== 'string') return value;
  const openspec = cloneRecord(value);
  const capabilities = Array.isArray(openspec['capabilities']) ? openspec['capabilities'] : [];
  openspec['capabilities'] = [openspec['capability'], ...capabilities];
  delete openspec['capability'];
  return openspec;
}

function normalizeScope(manifest: UnknownRecord) {
  const allowed = manifest['allowed_code_paths'];
  const forbidden = manifest['forbidden_code_paths'];
  if (allowed === undefined && forbidden === undefined) return;
  const scope = isRecord(manifest['scope']) ? cloneRecord(manifest['scope']) : {};
  if (scope['allowed_paths'] === undefined && allowed !== undefined)
    scope['allowed_paths'] = allowed;
  if (scope['forbidden_paths'] === undefined && forbidden !== undefined) {
    scope['forbidden_paths'] = forbidden;
  }
  manifest['scope'] = scope;
  delete manifest['allowed_code_paths'];
  delete manifest['forbidden_code_paths'];
}

export function normalizePromptPack(value: unknown): NormalizedPromptPack {
  if (!isRecord(value)) return { manifest: value as PromptPack, migrated: false };
  const manifest = cloneRecord(value);
  const sourceVersion = manifest['schema_version'];
  const migrated = sourceVersion === undefined || sourceVersion === 1;

  // A manifest that explicitly claims v2 must satisfy the v2 schema as written.
  // Compatibility normalization is reserved for legacy manifests so malformed
  // v2 input cannot silently acquire different semantics at runtime.
  if (!migrated) return { manifest: manifest as PromptPack, migrated: false };
  manifest['schema_version'] = 2;

  if ('documents' in manifest) manifest['documents'] = normalizeDocuments(manifest['documents']);
  if ('openspec' in manifest) manifest['openspec'] = normalizeOpenSpec(manifest['openspec']);
  if ('skills' in manifest) manifest['skills'] = normalizeSkills(manifest['skills']);
  if ('quality_gates' in manifest) {
    manifest['quality_gates'] = normalizeQualityGates(manifest['quality_gates']);
  }
  if ('activation_requirements' in manifest) {
    manifest['activation_requirements'] = normalizeLegacyStringList(
      manifest['activation_requirements'],
    );
  }
  if ('documentation_sync' in manifest) {
    manifest['documentation_sync'] = normalizeLegacyStringList(manifest['documentation_sync']);
  }
  normalizeScope(manifest);
  return { manifest: manifest as PromptPack, migrated };
}

export function hasCondition(rule: { when?: RuleCondition | undefined }) {
  const when = rule.when;
  return Boolean(when?.document_exists || when?.change_touches?.length || when?.predicates?.length);
}
