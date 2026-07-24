import { extractIssueKey } from './branch-policy.js';

const allowedTypes = [
  'feat',
  'fix',
  'hotfix',
  'refactor',
  'docs',
  'test',
  'ci',
  'build',
  'chore',
  'perf',
  'revert',
] as const;

const typedTitleRegex = new RegExp(
  `^\\[[A-Z][A-Z0-9]+-[0-9]+\\] - (${allowedTypes.join('|')}): .{8,}$`,
);

export function validatePrTitle(title: string, branchName?: string): string[] {
  if (!title) {
    return ['PR title is required.'];
  }

  if (!typedTitleRegex.test(title)) {
    return [
      `Invalid PR title: ${title}`,
      'Expected format: [ABC-123] - feat: Descripcion corta del PR',
    ];
  }

  const branchIssueKey = branchName ? extractIssueKey(branchName) : undefined;
  const titleIssueKey = extractIssueKey(title);

  if (branchIssueKey && titleIssueKey !== branchIssueKey) {
    return [`PR title ticket ${titleIssueKey} does not match branch ticket ${branchIssueKey}.`];
  }

  return [];
}

export function validateCommitMessage(message: string, branchName?: string): string[] {
  const subject = message.split(/\r?\n/)[0]?.trim() ?? '';

  if (!typedTitleRegex.test(subject)) {
    return [
      `Invalid commit message: ${subject}`,
      'Expected format: [ABC-123] - feat: descripcion corta',
    ];
  }

  const branchIssueKey = branchName ? extractIssueKey(branchName) : undefined;
  const commitIssueKey = extractIssueKey(subject);

  if (branchIssueKey && commitIssueKey !== branchIssueKey) {
    return [`Commit ticket ${commitIssueKey} does not match branch ticket ${branchIssueKey}.`];
  }

  return [];
}

export function validatePrBody(body: string): string[] {
  const normalizedBody = body
    .replace(/^#+\s.*$/gm, '')
    .replace(/-\s\[[ x]\].*$/gim, '')
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace(/(que cambia|por que|como se probo|riesgo principal):?/gim, '')
    .trim();

  if (normalizedBody.length < 40) {
    return ['PR body must include a real description with at least 40 meaningful characters.'];
  }

  return [];
}

export function validatePrRiskBody(body: string): string[] {
  const errors = validatePrBody(body);
  const sections = [
    { heading: /pruebas y evidencia/i, label: 'test evidence' },
    { heading: /riesgo y rollback/i, label: 'risk and rollback' },
    { heading: /seguridad/i, label: 'security impact' },
  ];

  for (const section of sections) {
    const content = sectionContent(body, section.heading);
    let commentClean = content;
    while (commentClean.includes('<!--')) {
      const next = commentClean.replace(/<!--[\s\S]*?-->/g, '');
      if (next === commentClean) break;
      commentClean = next;
    }
    const meaningful = commentClean
      .replace(/^\s*-\s*\[[ x]\].*$/gim, '')
      .replace(/^\s*(describe|indica|explica|agrega)\b.*$/gim, '')
      .replace(/[^\p{L}\p{N}]+/gu, ' ')
      .trim();
    if (meaningful.length < 8) {
      errors.push(`PR body must describe ${section.label}.`);
    }
  }

  return [...new Set(errors)];
}

function sectionContent(body: string, heading: RegExp): string {
  const lines = body.split(/\r?\n/);
  const start = lines.findIndex((line) => /^#{1,6}\s+/.test(line) && heading.test(line));
  if (start < 0) return '';
  const end = lines.findIndex((line, index) => index > start && /^#{1,6}\s+/.test(line));
  return lines.slice(start + 1, end < 0 ? undefined : end).join('\n');
}
