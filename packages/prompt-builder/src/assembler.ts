import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { formatTargetProfile } from './target-profile.js';
import type { LoadedDocument, OpenSpecContext, Phase, ResolvedTargetProfile } from './types.js';

const TOOL_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

export async function loadTemplate(phase: Phase) {
  return readFile(path.join(TOOL_ROOT, 'templates', `${phase}.md`), 'utf8');
}

export function assemble(input: {
  template: string;
  packId: string;
  change?: string | undefined;
  skills: string[];
  qualityGates: string[];
  allowedPaths: string[];
  forbiddenPaths: string[];
  dependencies: string[];
  targetProfile?: ResolvedTargetProfile | undefined;
  documents: LoadedDocument[];
  openspec: OpenSpecContext;
}) {
  const docs = input.documents.map((d) => `\n## Source: ${d.source}\n\n${d.content}`).join('\n');

  const spec = Object.entries(input.openspec)
    .map(([name, content]) => `\n## OpenSpec: ${name}\n\n${content}`)
    .join('\n');

  return input.template
    .replaceAll('{{PACK_ID}}', input.packId)
    .replaceAll('{{CHANGE}}', input.change ?? 'none')
    .replaceAll('{{SKILLS}}', input.skills.map((s) => `- $${s}`).join('\n') || '- none declared')
    .replaceAll(
      '{{QUALITY_GATES}}',
      input.qualityGates.map((s) => `- ${s}`).join('\n') || '- none declared',
    )
    .replaceAll(
      '{{ALLOWED_PATHS}}',
      input.allowedPaths.map((s) => `- ${s}`).join('\n') || '- read/review scope only',
    )
    .replaceAll(
      '{{FORBIDDEN_PATHS}}',
      input.forbiddenPaths.map((s) => `- ${s}`).join('\n') || '- none declared',
    )
    .replaceAll(
      '{{DEPENDENCIES}}',
      input.dependencies.map((s) => `- ${s}`).join('\n') || '- none; root execution pack',
    )
    .replaceAll('{{TARGET_PROFILE}}', formatTargetProfile(input.targetProfile))
    .replaceAll('{{DOCUMENTS}}', docs)
    .replaceAll('{{OPENSPEC}}', spec || 'No OpenSpec artifacts found for this invocation.');
}
