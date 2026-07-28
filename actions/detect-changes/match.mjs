#!/usr/bin/env node
/**
 * Evalua las reglas de `detect-changes` contra la lista de archivos cambiados.
 *
 * Se ejecuta como script y no como bash porque comparar globs con `case` obliga
 * a duplicar logica por patron, no distingue `*` de `**` y falla en silencio
 * cuando una regla esta mal escrita. Aqui una regla invalida es un error.
 *
 * Entradas por entorno:
 *   RULES         reglas `nombre=glob1,glob2`, una por linea
 *   CHANGED_FILES rutas separadas por saltos de linea
 *   RESOLVED      'true' si el diff se pudo determinar
 *   FALLBACK      valor aplicado a todas las reglas cuando RESOLVED != 'true'
 *
 * Salida: un objeto JSON por stdout, `{ "unit": true, "docs": false }`.
 */

/**
 * Traduce un glob a expresion regular.
 *
 * Reglas soportadas, deliberadamente pocas:
 *   `**` cualquier profundidad de directorios
 *   `*`  cualquier cosa dentro de un unico segmento
 *   `?`  un caracter dentro de un segmento
 *
 * `src/**` incluye `src/a.ts` y `src/a/b.ts`. Ese caso es el que suele fallar
 * en implementaciones caseras y por eso tiene test propio.
 */
export function globToRegExp(glob) {
  if (typeof glob !== 'string' || glob.length === 0) {
    throw new Error('El glob no puede estar vacio');
  }

  let pattern = '';

  for (let index = 0; index < glob.length; index += 1) {
    const character = glob[index];

    if (character === '*') {
      const isDoubleStar = glob[index + 1] === '*';

      if (isDoubleStar) {
        // `foo/**` debe casar tambien con `foo` exacto y con `foo/a/b`.
        if (glob[index + 2] === '/') {
          pattern += '(?:.*/)?';
          index += 2;
        } else {
          pattern += '.*';
          index += 1;
        }
        continue;
      }

      pattern += '[^/]*';
      continue;
    }

    if (character === '?') {
      pattern += '[^/]';
      continue;
    }

    pattern += character.replace(/[.+^${}()|[\]\\]/g, '\\$&');
  }

  // `src/**` sin sufijo debe cubrir el arbol completo bajo `src/`.
  if (glob.endsWith('/**')) {
    pattern = `${pattern}.*`;
  }

  return new RegExp(`^${pattern}$`);
}

export function parseRules(raw) {
  const rules = new Map();

  for (const line of (raw ?? '').split('\n')) {
    const trimmed = line.trim();

    if (trimmed === '' || trimmed.startsWith('#')) {
      continue;
    }

    const separator = trimmed.indexOf('=');

    if (separator <= 0) {
      throw new Error(`Regla invalida, se esperaba "nombre=glob1,glob2": ${trimmed}`);
    }

    const name = trimmed.slice(0, separator).trim();
    const globs = trimmed
      .slice(separator + 1)
      .split(',')
      .map((glob) => glob.trim())
      .filter(Boolean);

    if (globs.length === 0) {
      throw new Error(`La regla "${name}" no declara ningun glob`);
    }

    rules.set(name, {
      include: globs.filter((glob) => !glob.startsWith('!')).map(globToRegExp),
      exclude: globs
        .filter((glob) => glob.startsWith('!'))
        .map((glob) => globToRegExp(glob.slice(1))),
    });
  }

  if (rules.size === 0) {
    throw new Error('No se declaro ninguna regla');
  }

  return rules;
}

export function evaluate({ rules, files, resolved, fallback }) {
  const parsed = parseRules(rules);

  if (!resolved) {
    return Object.fromEntries([...parsed.keys()].map((name) => [name, fallback]));
  }

  const normalized = files
    .split('\n')
    .map((file) => file.trim())
    .filter(Boolean);

  return Object.fromEntries(
    [...parsed.entries()].map(([name, { include, exclude }]) => [
      name,
      normalized.some(
        (file) =>
          include.some((pattern) => pattern.test(file)) &&
          !exclude.some((pattern) => pattern.test(file)),
      ),
    ]),
  );
}

if (process.env['RULES'] !== undefined) {
  try {
    const result = evaluate({
      rules: process.env['RULES'],
      files: process.env['CHANGED_FILES'] ?? '',
      resolved: process.env['RESOLVED'] === 'true',
      fallback: (process.env['FALLBACK'] ?? 'true') === 'true',
    });

    process.stdout.write(JSON.stringify(result));
  } catch (error) {
    process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`);
    process.exit(1);
  }
}
