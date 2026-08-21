import { conditionMatches } from './condition-evaluator.js';
import type { ConditionContext, LoadedDocument, PromptPack, SkillConfiguration } from './types.js';

export function resolveSkills(
  packs: PromptPack[],
  documents: LoadedDocument[] = [],
  context: ConditionContext = {},
) {
  const skills = new Set<string>();
  for (const pack of packs) {
    const configuration: SkillConfiguration | undefined = pack.skills;
    for (const skill of configuration?.primary ?? []) skills.add(skill);
    for (const skill of configuration?.supporting ?? []) skills.add(skill);
    for (const rule of Object.values(configuration?.conditional ?? {})) {
      if (!conditionMatches(rule.when, documents, context)) continue;
      for (const skill of rule.use ?? []) skills.add(skill);
    }
  }
  return [...skills];
}
