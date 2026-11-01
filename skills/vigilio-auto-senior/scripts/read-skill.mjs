#!/usr/bin/env node
import crypto from 'node:crypto';
/**
 * Lectura completa, auditable y restringida a una SKILL.md autorizada o sus
 * referencias. Acepta instalación empaquetada y consumidor instalado.
 * No convierte un archivo leído en comprensión o ejecución por parte de la IA.
 */
import fs from 'node:fs';
import path from 'node:path';

const args = process.argv.slice(2);
function option(flag, fallback) {
  const i = args.indexOf(flag);
  if (i < 0) return fallback;
  if (!args[i + 1] || args[i + 1].startsWith('--')) throw new Error(`falta valor ${flag}`);
  return args[i + 1];
}
function within(parent, child) {
  return child === parent || child.startsWith(parent + path.sep);
}
function fail(message) {
  console.error(`BLOCKED read-skill: ${message}`);
  process.exit(2);
}
try {
  const root = path.resolve(option('--root', process.cwd()));
  const name = option('--skill', '');
  const reference = option('--reference', '');
  if (!/^[a-z][a-z0-9-]*$/.test(name)) throw new Error('nombre de skill inválido');
  if (!fs.statSync(root, { throwIfNoEntry: false })?.isDirectory())
    throw new Error('raíz de proyecto ausente');
  const installed = path.join(root, '.opencode', 'skills');
  const bundled = path.resolve(import.meta.dirname, '../..');
  const isInstalled = fs.statSync(installed, { throwIfNoEntry: false })?.isDirectory() ?? false;
  const base = isInstalled ? installed : bundled;
  const skillDir = path.join(base, name);
  const skillEntry = path.join(skillDir, 'SKILL.md');
  const realSkillDir = fs.realpathSync(skillDir);
  const realBase = fs.realpathSync(base);
  if (!within(realBase, realSkillDir)) throw new Error('skill enlazada fuera de raíz autorizada');

  const virtualDocs = path.join(base, '.vigilio-docs');
  const possibleDocs = isInstalled
    ? [virtualDocs, path.join(root, '.vigilio-docs')]
    : [path.resolve(bundled, '../docs')];
  const docRoots = possibleDocs
    .filter((p) => fs.statSync(p, { throwIfNoEntry: false })?.isDirectory())
    .map((p) => ({ logical: p, real: fs.realpathSync(p) }));
  // Un documento consumidor siempre queda bajo su árbol; rechazar symlink que
  // salte a /etc, ~/.ssh, otro proyecto o contenido fuera de Docs.
  const rootReal = fs.realpathSync(root);
  if (isInstalled) {
    for (const dr of docRoots)
      if (!within(rootReal, dr.real))
        throw new Error('docs canónicos enlazados fuera del proyecto');
  }

  let filename = skillEntry;
  let approvedDocsReference = false;
  if (reference) {
    if (
      /^(?:[a-z][a-z\d+.-]*:|\/|\\|[A-Za-z]:)/i.test(reference) ||
      reference.includes('\\') ||
      reference.includes('\0')
    )
      throw new Error('referencia absoluta, URI o separador no autorizado');
    const normalized = reference.split('#', 1)[0].split('?', 1)[0];
    if (!normalized?.endsWith('.md')) throw new Error('referencia Markdown inválida');
    const virtualFile = path.resolve(skillDir, normalized);
    if (within(virtualDocs, virtualFile)) {
      approvedDocsReference = true;
      const rel = path.relative(virtualDocs, virtualFile);
      if (!rel || rel.startsWith('..')) throw new Error('referencia canónica inválida');
      const chosen = docRoots.find(({ logical }) =>
        fs.statSync(path.join(logical, rel), { throwIfNoEntry: false })?.isFile(),
      );
      if (!chosen) throw new Error(`referencia canónica ausente: ${rel}`);
      filename = path.join(chosen.logical, rel);
    } else {
      if (!within(skillDir, virtualFile))
        throw new Error('referencia fuera de skill o docs canónicos');
      filename = virtualFile;
    }
  }
  const resolved = fs.realpathSync(filename);
  const stat = fs.statSync(resolved);
  if (!stat.isFile() || stat.size > 256 * 1024)
    throw new Error('archivo demasiado grande o no regular');
  const authorized = approvedDocsReference
    ? docRoots.some(({ real }) => within(real, resolved))
    : within(realSkillDir, resolved);
  if (!authorized) throw new Error('ruta fuera de skill o docs canónicos');
  if (isInstalled && !within(rootReal, resolved)) throw new Error('ruta externa al proyecto');
  const data = fs.readFileSync(resolved);
  console.log(
    JSON.stringify(
      {
        status: 'READ_FILE_CONTENT_EMITTED',
        skill: name,
        reference: reference || null,
        path: resolved,
        sha256: crypto.createHash('sha256').update(data).digest('hex'),
        bytes: data.length,
        content: data.toString('utf8'),
        note: 'El host debe consumir el contenido. Este proceso no acredita comprensión ni aplicación de la skill.',
      },
      null,
      2,
    ),
  );
} catch (error) {
  fail(error.message);
}
