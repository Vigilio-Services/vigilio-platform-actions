export interface UsesReference {
  readonly line: number;
  readonly target: string;
}

function stripYamlComment(line: string): string {
  let inSingleQuote = false;
  let inDoubleQuote = false;
  let escaped = false;

  for (let index = 0; index < line.length; index += 1) {
    const character = line[index];

    if (inDoubleQuote && character === '\\' && !escaped) {
      escaped = true;
      continue;
    }

    if (character === '"' && !inSingleQuote && !escaped) {
      inDoubleQuote = !inDoubleQuote;
    } else if (character === "'" && !inDoubleQuote) {
      if (inSingleQuote && line[index + 1] === "'") {
        index += 1;
      } else {
        inSingleQuote = !inSingleQuote;
      }
    } else if (
      character === '#' &&
      !inSingleQuote &&
      !inDoubleQuote &&
      (index === 0 || /\s/.test(line[index - 1] ?? ''))
    ) {
      return line.slice(0, index);
    }

    escaped = false;
  }

  return line;
}

export function activeYaml(content: string): string {
  return content.split('\n').map(stripYamlComment).join('\n');
}

export function usesReferences(content: string): UsesReference[] {
  const references: UsesReference[] = [];

  for (const [index, line] of activeYaml(content).split('\n').entries()) {
    const match = line.match(/\buses:\s*([^\s#]+)/);
    if (match?.[1]) {
      references.push({ line: index + 1, target: match[1] });
    }
  }

  return references;
}

export function validatePinnedUses(content: string, source: string): string[] {
  const errors: string[] = [];

  for (const reference of usesReferences(content)) {
    const { line, target } = reference;
    if (target.startsWith('./')) {
      continue;
    }

    if (target.startsWith('docker://')) {
      if (!/@sha256:[a-f0-9]{64}$/i.test(target)) {
        errors.push(`${source}:${line}: container action must use a sha256 digest: ${target}`);
      }
      continue;
    }

    const separator = target.lastIndexOf('@');
    const revision = separator >= 0 ? target.slice(separator + 1) : '';
    if (!/^[a-f0-9]{40}$/i.test(revision)) {
      errors.push(`${source}:${line}: remote action must use a full commit SHA: ${target}`);
    }
  }

  return errors;
}

export function validateCheckoutCredentials(content: string, source: string): string[] {
  const lines = activeYaml(content).split('\n');
  const errors: string[] = [];

  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index] ?? '';
    if (!/\buses:\s*actions\/checkout@/.test(line)) {
      continue;
    }

    const usesIndent = line.search(/\S/);
    const stepIndent = line.trimStart().startsWith('- ')
      ? usesIndent
      : findParentStepIndent(lines, index, usesIndent);
    const stepLines = [line];
    for (let cursor = index + 1; cursor < lines.length; cursor += 1) {
      const candidate = lines[cursor] ?? '';
      if (candidate.trim() === '') {
        continue;
      }

      const candidateIndent = candidate.search(/\S/);
      if (candidateIndent <= stepIndent) {
        break;
      }
      stepLines.push(candidate);
    }

    if (!stepLines.join('\n').match(/persist-credentials:\s*false/)) {
      errors.push(`${source}:${index + 1}: checkout must set persist-credentials: false`);
    }
  }

  return errors;
}

function findParentStepIndent(
  lines: readonly string[],
  usesIndex: number,
  usesIndent: number,
): number {
  for (let cursor = usesIndex - 1; cursor >= 0; cursor -= 1) {
    const candidate = lines[cursor] ?? '';
    if (candidate.trim() === '') continue;

    const candidateIndent = candidate.search(/\S/);
    if (candidateIndent < usesIndent && candidate.trimStart().startsWith('- ')) {
      return candidateIndent;
    }
    if (candidateIndent < usesIndent) break;
  }

  return usesIndent;
}
