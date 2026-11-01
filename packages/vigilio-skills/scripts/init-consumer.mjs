#!/usr/bin/env node
/**
 * Bootstrap no destructivo para proyectos consumidores de Vigilio.
 * Rechaza enlaces simbólicos en cualquiera de los destinos gestionados, incluso
 * cuando el archivo ya existe: nunca seguir enlaces fuera del proyecto.
 */
import {
  closeSync,
  constants,
  existsSync,
  lstatSync,
  mkdirSync,
  openSync,
  readFileSync,
  realpathSync,
  unlinkSync,
  writeFileSync,
} from 'node:fs';
import path from 'node:path';

const packageRoot = path.resolve(import.meta.dirname, '..');
const templates = path.join(packageRoot, 'assets', 'templates', 'project');
const rootArg = process.argv.indexOf('--root');
if (rootArg >= 0 && !process.argv[rootArg + 1]) {
  console.error('Falta valor para --root');
  process.exit(2);
}
const consumer = rootArg < 0 ? process.cwd() : path.resolve(process.argv[rootArg + 1]);
const apply = process.argv.includes('--apply');
const marker = '<!-- VIGILIO AUTO-SENIOR: managed start -->';
const end = '<!-- VIGILIO AUTO-SENIOR: managed end -->';
const files = [
  'scripts/vigilio-services-check.sh',
  '.env.vigilio.example',
  '.opencode/commands/vigilio-skill.md',
];
const statOrNull = (file) => lstatSync(file, { throwIfNoEntry: false });
function abort(message) {
  throw new Error(message);
}

/**
 * Comprobar TODO el plan antes de escribir evita instalaciones parcialmente
 * seguras cuando un destino tardío contiene un symlink o un archivo inesperado.
 */
function inspectDestination(relativePath) {
  const normalized = path.posix.normalize(relativePath.replaceAll('\\', '/'));
  if (normalized === '.' || normalized.startsWith('../') || path.isAbsolute(normalized)) {
    abort(`Destino fuera del proyecto: ${relativePath}`);
  }
  let current = consumer;
  const parts = normalized.split('/');
  for (let i = 0; i < parts.length; i++) {
    current = path.join(current, parts[i]);
    const stat = statOrNull(current);
    if (stat?.isSymbolicLink())
      abort(`Ruta simbólica no permitida: ${relativePath} (${parts.slice(0, i + 1).join('/')})`);
    if (stat && i < parts.length - 1 && !stat.isDirectory()) {
      abort(`Directorio esperado es un archivo: ${parts.slice(0, i + 1).join('/')}`);
    }
    if (stat && i === parts.length - 1 && !stat.isFile()) {
      abort(`Destino no es archivo regular: ${relativePath}`);
    }
  }
  return current;
}

/** Crear nuevos archivos sin seguir symlinks (O_EXCL + O_NOFOLLOW). */
function createFileExclusive(source, dest) {
  const flags =
    constants.O_WRONLY | constants.O_CREAT | constants.O_EXCL | (constants.O_NOFOLLOW ?? 0);
  const fd = openSync(dest, flags, 0o644);
  try {
    writeFileSync(fd, readFileSync(source));
  } catch (error) {
    try {
      unlinkSync(dest);
    } catch {
      /* preserve original error */
    }
    throw error;
  } finally {
    closeSync(fd);
  }
}

try {
  const rootStat = statOrNull(consumer);
  if (!rootStat?.isDirectory() || rootStat.isSymbolicLink())
    abort('Raíz inexistente, no directorio o symlink');
  if (realpathSync.native(consumer) !== consumer) {
    abort('La ruta del proyecto contiene enlaces simbólicos; usar ruta física real');
  }
  if (
    !existsSync(path.join(consumer, '.git')) &&
    !existsSync(path.join(consumer, 'package.json')) &&
    !existsSync(path.join(consumer, 'composer.json')) &&
    !existsSync(path.join(consumer, 'Cargo.toml')) &&
    !existsSync(path.join(consumer, 'CMakeLists.txt'))
  ) {
    abort(
      'No se identificó proyecto consumidor (.git, package.json, composer.json, Cargo.toml o CMakeLists.txt)',
    );
  }

  const planned = files.map((relative) => ({
    relative,
    source: path.join(templates, relative),
    dest: inspectDestination(relative),
  }));
  const agents = inspectDestination('AGENTS.md');
  const current = existsSync(agents) ? readFileSync(agents, 'utf8') : '';
  if (current.includes(marker) !== current.includes(end))
    abort('AGENTS.md contiene marcadores Vigilio incompletos');
  const block = readFileSync(path.join(templates, 'AGENTS.vigilio.md'), 'utf8').trim();

  for (const item of planned) {
    if (existsSync(item.dest)) {
      console.log(`KEEP  ${item.relative} (ya existe)`);
      continue;
    }
    console.log(`${apply ? 'CREATE' : 'PLAN  '} ${item.relative}`);
    if (apply) {
      // Segunda comprobación antes de escribir, incluida cadena de directorios.
      inspectDestination(item.relative);
      mkdirSync(path.dirname(item.dest), { recursive: true });
      inspectDestination(item.relative);
      createFileExclusive(item.source, item.dest);
    }
  }

  if (current.includes(marker)) {
    console.log('KEEP  AGENTS.md (bloque Vigilio presente)');
  } else {
    console.log(`${apply ? 'APPEND' : 'PLAN  '} AGENTS.md (sin reemplazar reglas existentes)`);
    if (apply) {
      inspectDestination('AGENTS.md');
      const content = `${current.trimEnd()}${current ? '\n\n' : ''}${marker}\n${block}\n${end}\n`;
      if (existsSync(agents)) {
        // Para evitar un append en un symlink sustituido, abrir con O_NOFOLLOW.
        const fd = openSync(
          agents,
          constants.O_WRONLY | constants.O_APPEND | (constants.O_NOFOLLOW ?? 0),
        );
        // Anexar solo el bloque Vigilio: nunca reescribir reglas previas.
        const appendBlock = `${current.endsWith('\n') ? '\n' : '\n\n'}${marker}\n${block}\n${end}\n`;
        try {
          writeFileSync(fd, appendBlock);
        } finally {
          closeSync(fd);
        }
      } else {
        const fd = openSync(
          agents,
          constants.O_WRONLY | constants.O_CREAT | constants.O_EXCL | (constants.O_NOFOLLOW ?? 0),
          0o644,
        );
        try {
          writeFileSync(fd, content);
        } finally {
          closeSync(fd);
        }
      }
    }
  }
  console.log(
    apply
      ? 'Plantillas instaladas. Revisar y versionar cambios con Git.'
      : 'Dry-run: pasar --apply para instalar sin sobrescribir archivos.',
  );
} catch (error) {
  console.error(`BLOCKED init-consumer: ${error.message}`);
  process.exitCode = 2;
}
