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

/**
 * Detecta claves repetidas dentro del mismo bloque YAML.
 *
 * Un `defaults:` o `steps:` duplicado por copia-pega produce un documento que
 * GitHub Actions rechaza entero, pero que pasa cualquier validacion basada en
 * buscar cadenas. Ocurrio de verdad en `shared-backend-node-nest-deploy-cdk.yml`
 * y nadie lo vio porque ningun gate parseaba la estructura.
 *
 * Se implementa por lineas y no con un parser para mantener el paquete sin
 * dependencias: una libreria de YAML aqui seria superficie de supply chain en
 * el componente que audita a todos los demas. El alcance es deliberadamente
 * estrecho: solo claves duplicadas, que es la clase de fallo que se escapa.
 */
export function validateNoDuplicateKeys(content: string, source: string): string[] {
  const errors: string[] = [];
  const lines = content.split('\n');
  // Cada nivel guarda su indentacion y las claves ya vistas en ese bloque.
  const stack: Array<{ indent: number; keys: Map<string, number> }> = [];

  let blockScalarIndent: number | null = null;

  for (const [index, rawLine] of lines.entries()) {
    const line = rawLine.replace(/\r$/, '');
    const trimmed = line.trim();

    if (trimmed === '' || trimmed.startsWith('#')) {
      continue;
    }

    const indent = line.search(/\S/);

    // Dentro de un escalar de bloque (`run: |`) el contenido es texto libre y
    // puede incluir `algo:` sin ser una clave YAML.
    if (blockScalarIndent !== null) {
      if (indent > blockScalarIndent) {
        continue;
      }
      blockScalarIndent = null;
    }

    while (stack.length > 0 && indent < (stack.at(-1)?.indent ?? 0)) {
      stack.pop();
    }

    // Un elemento de lista abre su propio mapa: `- name:` y `- name:` en dos
    // pasos distintos no son duplicados.
    const isListItem = trimmed.startsWith('- ');
    const keyPart = isListItem ? trimmed.slice(2).trim() : trimmed;

    if (isListItem) {
      while (stack.length > 0 && indent <= (stack.at(-1)?.indent ?? 0)) {
        stack.pop();
      }
      stack.push({ indent, keys: new Map() });
    }

    const keyMatch = /^([A-Za-z_][\w.-]*|"[^"]+"|'[^']+'):(\s|$)/.exec(keyPart);

    if (!keyMatch?.[1]) {
      continue;
    }

    const key = keyMatch[1].replace(/^["']|["']$/g, '');
    const effectiveIndent = isListItem ? indent + 2 : indent;

    if (stack.length === 0 || effectiveIndent > (stack.at(-1)?.indent ?? -1)) {
      stack.push({ indent: effectiveIndent, keys: new Map() });
    }

    const current = stack.at(-1);

    if (current && current.indent === effectiveIndent) {
      const previous = current.keys.get(key);

      if (previous !== undefined) {
        errors.push(
          `${source}:${index + 1}: duplicate key "${key}" in the same block (first seen at line ${previous})`,
        );
      } else {
        current.keys.set(key, index + 1);
      }
    }

    if (/:\s*[|>][+-]?\s*$/.test(keyPart)) {
      blockScalarIndent = indent;
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

    const stepIndent = line.search(/\S/);
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
