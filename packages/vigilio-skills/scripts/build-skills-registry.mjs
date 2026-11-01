#!/usr/bin/env node
// Genera inventario SIN cargar todas las skills en el contexto de la IA.
import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve(import.meta.dirname, '..');
const skillsRoot = path.join(root, 'assets', 'skills');
const profiles = JSON.parse(
  fs.readFileSync(path.join(root, 'assets', 'profiles.json'), 'utf8'),
).profiles;
const skillProfiles = new Map();
for (const [profile, skills] of Object.entries(profiles))
  for (const name of skills) {
    if (!skillProfiles.has(name)) skillProfiles.set(name, []);
    skillProfiles.get(name).push(profile);
  }
const catalog = [];
for (const entry of fs.readdirSync(skillsRoot, { withFileTypes: true })) {
  if (!entry.isDirectory()) continue;
  const name = entry.name;
  const filename = path.join(skillsRoot, name, 'SKILL.md');
  if (!fs.existsSync(filename)) throw new Error(`Skill sin SKILL.md: ${name}`);
  const content = fs.readFileSync(filename, 'utf8');
  const match = content.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (!match) throw new Error(`Falta frontmatter: ${name}`);
  const get = (field) =>
    (match[1].match(new RegExp(`^${field}:\\s*(.*)$`, 'm')) ?? [])[1]?.trim() ?? '';
  if (get('name') !== name) throw new Error(`Skill name distinto de ruta: ${name}`);
  // Declaraciones opt-in: el router evoluciona con nuevas skills sin hardcodear tecnologías.
  // No conceder autoridad de ejecución a estos metadatos; son pistas de descubrimiento.
  const csv = (key) =>
    get(key)
      .replace(/^['"]|['"]$/g, '')
      .split(',')
      .map((x) => x.trim().toLowerCase())
      .filter(Boolean);
  catalog.push({
    name,
    description: get('description'),
    profiles: skillProfiles.get(name) ?? [],
    entry: `assets/skills/${name}/SKILL.md`,
    routing: {
      ecosystems: csv('routing_ecosystems'),
      keywords: csv('routing_keywords'),
      files: csv('routing_files'),
      capabilities: csv('routing_capabilities'),
    },
  });
}
const missing = [...skillProfiles.keys()].filter((k) => !catalog.find((x) => x.name === k));
if (missing.length) throw new Error(`Perfiles con skills inexistentes: ${missing.join(', ')}`);
catalog.sort((a, b) => a.name.localeCompare(b.name));
const output = {
  schema: 1,
  source: 'generated-from-bundled-skills-and-profiles',
  count: catalog.length,
  profile_count: Object.keys(profiles).length,
  skills: catalog,
};
const dest = path.join(root, 'assets', 'skills-registry.json');
const serialized = `${JSON.stringify(output, null, 2)}\n`;
if (process.argv.includes('--check')) {
  if (!fs.existsSync(dest) || fs.readFileSync(dest, 'utf8') !== serialized) {
    console.error('Skill registry stale');
    process.exit(1);
  }
  console.log(`Registry PASS: ${catalog.length} skills / ${Object.keys(profiles).length} profiles`);
} else {
  fs.writeFileSync(dest, serialized);
  console.log(
    `Registry generated: ${catalog.length} skills / ${Object.keys(profiles).length} profiles`,
  );
}
