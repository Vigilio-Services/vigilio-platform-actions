import path from 'node:path';
import type { LoadedDocument, PromptPack, SkillConfiguration } from './types.js';

export function resolveSkills(packs: PromptPack[], documents: LoadedDocument[] = []) {
  const skills = new Set<string>();
  const documentNames = new Set(documents.map((document) => path.basename(document.source)));
  for (const pack of packs) {
    if (Array.isArray(pack.skills)) {
      for (const skill of pack.skills) skills.add(skill);
      continue;
    }
    const configuration = pack.skills as SkillConfiguration | undefined;
    for (const skill of configuration?.primary ?? []) skills.add(skill);
    for (const skill of configuration?.supporting ?? []) skills.add(skill);
    for (const rule of Object.values(configuration?.conditional ?? {})) {
      if (rule.when_document_exists && !documentNames.has(rule.when_document_exists)) continue;
      if (rule.when_change_touches?.length) continue;
      for (const skill of rule.use ?? []) skills.add(skill);
    }
  }
  return [...skills];
}
