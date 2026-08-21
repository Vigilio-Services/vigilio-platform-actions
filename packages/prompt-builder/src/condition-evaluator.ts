import path from 'node:path';
import type { ConditionContext, LoadedDocument, RuleCondition } from './types.js';

function normalizePath(value: string) {
  return value.replaceAll('\\', '/').replace(/^\.\//, '');
}

function changeMatches(patterns: string[], changedPaths: string[]) {
  return changedPaths.some((changedPath) => {
    const candidate = normalizePath(changedPath);
    return patterns.some((pattern) => path.posix.matchesGlob(candidate, normalizePath(pattern)));
  });
}

export function conditionMatches(
  condition: RuleCondition | undefined,
  documents: LoadedDocument[],
  context: ConditionContext = {},
) {
  if (!condition) return true;
  if (condition.document_exists) {
    const documentNames = new Set(documents.map((document) => path.basename(document.source)));
    if (!documentNames.has(condition.document_exists)) return false;
  }

  if (condition.change_touches?.length && context.changedPaths?.length) {
    if (!changeMatches(condition.change_touches, context.changedPaths)) return false;
  }

  for (const predicate of condition.predicates ?? []) {
    const actual = context.predicates?.[predicate.name];
    // Unknown runtime facts activate conservatively: prompt-builder compiles controls,
    // it does not claim that a predicate was proven false.
    if (actual !== undefined && actual !== predicate.equals) return false;
  }
  return true;
}
