#!/usr/bin/env node
/**
 * Selector local reproducible y de SOLO LECTURA. Descubre manifests anidados,
 * skills instaladas y metadatos routing_* declarativos (incluye tecnologías futuras).
 * NUNCA ejecuta ni carga una skill: siempre PROPOSED_NOT_LOADED.
 */
import fs from 'node:fs';
import path from 'node:path';

const args = process.argv.slice(2);
function arg(flag, fallback) {
  const i = args.indexOf(flag);
  return i >= 0 ? args[i + 1] : fallback;
}
const root = path.resolve(arg('--root', process.cwd()));
const requestedScope = arg('--scope', '');
const scanRoot = requestedScope ? path.resolve(root, requestedScope) : root;
const rootReal = fs.realpathSync(root);
let scanReal;
try {
  scanReal = fs.realpathSync(scanRoot);
} catch {
  console.error('BLOCKED: --scope does not exist');
  process.exit(2);
}
if (scanReal !== rootReal && !scanReal.startsWith(rootReal + path.sep)) {
  console.error('BLOCKED: --scope escapes project root');
  process.exit(2);
}

const task = String(arg('--task', '')).trim();
if (!task) {
  console.error('Falta --task "..."');
  process.exit(2);
}
const norm = (s) =>
  String(s)
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
const words = norm(task);
const test = (re) => re.test(words);
const intent = test(
  /\breview\b|\brevisar\b|\bauditar\s+(?:codigo|pr|cambios)\b|pull request|\bpr\b/,
)
  ? 'review'
  : test(/\bbug\b|corrig|arregl|\bfix\b|falla/)
    ? 'bug'
    : test(/refactor|reorganiz|moderniz/)
      ? 'refactor'
      : test(/\be2e\b|\btest\b|pruebas|testing/)
        ? 'test'
        : test(/\brelease\b|\bdeploy\b|despleg|publica|distribu|installer|firma de/)
          ? 'release'
          : test(
                /arquitectura|dise[nñ]|recomiend|cual tecnologia|compar|tipo de software|(?:quiero|necesito)\s+(?:crear|hacer|desarrollar|construir)\s+(?:una?\s+)?(?:app|aplicacion|software|programa|sistema|videojuego|juego)/,
              )
            ? 'architecture'
            : 'feature';
const ignore = new Set([
  '.git',
  'node_modules',
  'target',
  'vendor',
  'build',
  'dist',
  '_site',
  '.next',
  'coverage',
  'out',
  '.venv',
  '__pycache__',
]);
const signals = {
  files: [],
  packages: [],
  godot: false,
  rust: false,
  cpp: false,
  c: false,
  nestjs: false,
  web: false,
  mobile: false,
  php: false,
  rhf: false,
  drizzle: false,
  qt: false,
  webengine: false,
  gpui: false,
  cli: false,
  backend: false,
  terraform: false,
  kubernetes: false,
  observability: false,
  database: false,
  backup: false,
  supplyChain: false,
  runtimeSecurity: false,
};
const MAX_FILES = 350,
  MAX_DEPTH = 4;
function _fileInRoot(filename) {
  return fs.existsSync(path.join(root, filename));
}
function traverse(dir, depth) {
  if (depth > MAX_DEPTH || signals.files.length >= MAX_FILES) return;
  let entries = [];
  try {
    entries = fs.readdirSync(dir, { withFileTypes: true });
  } catch {
    return;
  }
  for (const e of entries) {
    if (signals.files.length >= MAX_FILES) break;
    if (e.isSymbolicLink()) continue;
    if (e.isDirectory()) {
      if (!ignore.has(e.name) && !e.name.startsWith('.'))
        traverse(path.join(dir, e.name), depth + 1);
      continue;
    }
    if (!e.isFile()) continue;
    const p = path.join(dir, e.name),
      relative = path.relative(root, p).replaceAll(path.sep, '/');
    if (
      [
        'Cargo.toml',
        'rust-toolchain.toml',
        'CMakeLists.txt',
        'CMakePresets.json',
        'package.json',
        'pnpm-workspace.yaml',
        'composer.json',
        'vcpkg.json',
        'conanfile.py',
        'project.godot',
        'Dockerfile',
        'Containerfile.runtime',
        'Caddyfile',
        'Tiltfile',
        'compatibility.json',
        'COMPATIBILITY.md',
      ].includes(e.name) ||
      (/\.(?:cpp|hpp|cxx|cc|h|c|rs|tf|tfvars)$/i.test(e.name) && depth <= 3) ||
      (/(?:kustomization|Chart|values.*|application.*|applicationset.*|rollout.*|promotion.*|metallb.*|longhorn.*|keda.*|scaledobject.*|hpa.*|pdb.*|topology.*|karpenter.*|opencost.*|finops.*|velero.*|chaos.*|dr.*|otel-collector.*|prometheus.*|slo.*|alert.*|postgres.*|valkey.*|cnpg.*|barman.*|backup.*|cosign.*|syft.*|tracing.*|cilium.*|kyverno.*|policy-runtime.*|kind.*|docker-compose.*|compose)\.ya?ml$/i.test(
        e.name,
      ) &&
        depth <= 3) ||
      (/(?:openvex|operational-evidence|local-lab-preflight)\.json$/i.test(e.name) && depth <= 3)
    )
      signals.files.push(relative);
  }
}
traverse(scanRoot, 0);
const read = (relative) => {
  try {
    return fs.readFileSync(path.join(root, relative), 'utf8');
  } catch {
    return '';
  }
};
let combinedCMake = '',
  combinedCargo = '';
for (const file of signals.files) {
  if (file.endsWith('package.json')) {
    try {
      const j = JSON.parse(read(file));
      const dep = { ...j.dependencies, ...j.devDependencies };
      signals.packages.push({ file, dependencies: Object.keys(dep) });
      signals.nestjs ||= Boolean(dep['@nestjs/core']);
      signals.mobile ||= Boolean(dep.expo || dep['react-native']);
      signals.web ||= Boolean(
        (dep.react || dep.preact || dep['react-hook-form']) && !dep.expo && !dep['react-native'],
      );
      signals.rhf ||= Boolean(dep['react-hook-form']);
      signals.drizzle ||= Boolean(dep['drizzle-orm']);
    } catch {
      /* invalid manifest is not an instruction */
    }
  }
  if (file.endsWith('composer.json')) signals.php = true;
  if (file.endsWith('project.godot')) signals.godot = true;
  if (file.endsWith('Cargo.toml')) {
    signals.rust = true;
    combinedCargo += `\n${read(file)}`;
  }
  if (file.endsWith('CMakeLists.txt')) {
    combinedCMake += `\n${read(file)}`;
  }
  if (/\.(cpp|hpp|cc|cxx)$/.test(file)) signals.cpp = true;
  if (/\.c$/.test(file)) signals.c = true;
  if (file === 'rust-toolchain.toml') signals.rust = true;
  if (/\.(tf|tfvars)$/i.test(file) || file.endsWith('terragrunt.hcl')) signals.terraform = true;
  if (/(?:kustomization|Chart|values.*)\.ya?ml$/i.test(file)) signals.kubernetes = true;
  if (/(?:application.*|applicationset.*|rollout.*)\.ya?ml$/i.test(file)) {
    signals.gitops = true;
    signals.kubernetes = true;
  }
  if (/promotion.*\.ya?ml$/i.test(file)) {
    signals.promotion = true;
  }
  if (/(?:otel-collector.*|prometheus.*|slo.*|alert.*)\.ya?ml$/i.test(file))
    signals.observability = true;
  if (/(?:postgres.*|valkey.*|cnpg.*|backup.*)\.ya?ml$/i.test(file)) {
    signals.database = true;
    signals.backup = true;
  }
  if (/(?:cosign.*|syft.*)\.ya?ml$/i.test(file) || file.endsWith('openvex.json')) {
    signals.supplyChain = true;
  }
  if (/(?:tracing.*|cilium.*|kyverno.*|policy-runtime.*)\.ya?ml$/i.test(file)) {
    signals.runtimeSecurity = true;
  }
  if (/(?:metallb.*|longhorn.*)\.ya?ml$/i.test(file)) {
    signals.onprem = true;
    signals.kubernetes = true;
  }
  if (/(?:keda.*|scaledobject.*|hpa.*|pdb.*|topology.*|karpenter.*)\.ya?ml$/i.test(file)) {
    signals.scalability = true;
    signals.kubernetes = true;
  }
  if (/(?:opencost.*|finops.*)\.ya?ml$/i.test(file)) {
    signals.finops = true;
  }
  if (/(?:velero.*|chaos.*|dr.*)\.ya?ml$/i.test(file)) {
    signals.resilience = true;
    signals.kubernetes = true;
  }
}
// CMake alone is NOT evidence of C++; project(... LANGUAGES C) is a C-only project.
const cmakeWithoutComments = combinedCMake.replace(/#[^\n]*/g, '');
const projectLanguages = [...cmakeWithoutComments.matchAll(/\bproject\s*\(([^)]*)\)/gi)].map(
  (x) => x[1],
);
const explicitCxx =
  projectLanguages.some((x) => /\bLANGUAGES\s+[^)]*\bCXX\b/i.test(x)) ||
  /\benable_language\s*\(\s*CXX\s*\)/i.test(cmakeWithoutComments) ||
  /\bQt6::(?:Widgets|WebEngineWidgets|Core|Gui)\b/.test(cmakeWithoutComments);
const explicitCOnly =
  projectLanguages.some((x) => /\bLANGUAGES\s+C\s*$/i.test(x.trim())) && !explicitCxx;
signals.cpp ||= explicitCxx;
if (explicitCOnly && !signals.cpp) signals.c = true;
signals.gpui = /\bgpui\b/i.test(combinedCargo);
signals.cli = /\bclap\b/i.test(combinedCargo) || signals.files.some((f) => /apps\/cli\//.test(f));
signals.backend = /\b(axum|actix-web|rocket|salvo)\b/i.test(combinedCargo);
signals.qt =
  /Qt6(::| COMPONENTS? |Widgets\b|::Widgets)|QWidget|QApplication/i.test(combinedCMake) ||
  /find_package\s*\(\s*Qt6\b[^)]*\b(?:Widgets|Quick|Gui)\b/i.test(combinedCMake);
signals.webengine = /WebEngine(?:Widgets|Core|Quick)|QWebEngine/i.test(combinedCMake);
const projectFound = signals.files.some((f) =>
  /(package.json|composer.json|Cargo.toml|CMakeLists.txt|project.godot|\.tf|kustomization\.ya?ml|Chart\.ya?ml|Caddyfile|Containerfile\.runtime|compose\.ya?ml)$/.test(
    f,
  ),
);
// Discovery must still work when an installed skills folder doesn't exist.
const installed = path.join(root, '.opencode/skills');
const bundled = path.resolve(import.meta.dirname, '../..');
const skillsDir = fs.existsSync(installed) ? installed : bundled;
const source = fs.existsSync(installed) ? 'INSTALLED' : 'BUNDLED_PREVIEW';
const selected = new Map(),
  missing = new Set();
function add(name, reason) {
  if (selected.has(name)) return;
  const filename = path.join(skillsDir, name, 'SKILL.md');
  if (fs.existsSync(filename))
    selected.set(name, { name, reason, source: filename, loaded: false });
  else missing.add(name);
}
function parseMeta(content, key) {
  const front = content.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (!front) return [];
  const match = front[1].match(new RegExp(`^${key}:\\s*(.*)$`, 'm'));
  return match
    ? match[1]
        .trim()
        .replace(/^['"]|['"]$/g, '')
        .split(',')
        .map(norm)
        .map((x) => x.trim())
        .filter(Boolean)
    : [];
}
function hasSignal(pattern) {
  const q = norm(pattern);
  if (q.includes('*')) {
    const parts = q.split('*').filter(Boolean);
    return signals.files.some((f) => {
      const nf = norm(f);
      return parts.every((p) => nf.includes(p));
    });
  }
  return signals.files.some((f) => norm(f).includes(q));
}
function keywordMatches(text, kw) {
  const escaped = kw.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const regex = new RegExp(`(?:^|[^a-z0-9_-])${escaped}(?:$|[^a-z0-9_-])`, 'i');
  return regex.test(text);
}
// Prefer the user's explicitly named language when a monorepo contains multiple stacks.
const wantsRust = /\brust\b|\bcargo\b|\bgpui\b|\baxum\b|\btokio\b/.test(words);
const wantsCpp = /\bc\+\+\b|\bcpp\b|\bqt\b|\bwebengine\b|\bchromium\b/.test(words);
const mixedNative = signals.rust && signals.cpp;
const ambiguousNative = mixedNative && !requestedScope && !(wantsRust !== wantsCpp);
const useRust =
  signals.rust && (!mixedNative || Boolean(requestedScope) || (wantsRust && !wantsCpp));
const useCpp = signals.cpp && (!mixedNative || Boolean(requestedScope) || (wantsCpp && !wantsRust));
const stack = new Set([
  ...(useRust ? ['rust'] : []),
  ...(useCpp ? ['cpp'] : []),
  ...(signals.qt ? ['qt'] : []),
  ...(signals.webengine ? ['qt-webengine'] : []),
  ...(signals.nestjs ? ['node', 'nestjs'] : []),
  ...(signals.web ? ['web', 'react'] : []),
  ...(signals.mobile ? ['mobile', 'expo'] : []),
  ...(signals.php ? ['php', 'laravel'] : []),
  ...(signals.gpui ? ['gpui'] : []),
  ...(signals.godot ? ['godot', 'game'] : []),
  ...(signals.terraform ? ['terraform', 'aws'] : []),
  ...(signals.kubernetes ? ['kubernetes'] : []),
  ...(signals.onprem ? ['onprem-edge'] : []),
  ...(signals.gitops ? ['gitops'] : []),
  ...(signals.promotion ? ['promotion'] : []),
  ...(signals.backup || signals.database ? ['database', 'data-reliability'] : []),
  ...(signals.supplyChain ? ['supply-chain'] : []),
  ...(signals.runtimeSecurity ? ['runtime-security'] : []),
]);
const reviewOnly = intent === 'review';
const noCodePlan = !projectFound && intent === 'architecture';
const decisionRequired = noCodePlan || ambiguousNative || (!projectFound && intent === 'feature');
add('vigilio-auto-senior', 'entrada única: inspección, decisión y evidencia');
if (reviewOnly) add('review-code-change', 'revisión read-only');
else if (intent === 'bug') add('diagnosing-bugs', 'reproducir causa antes de parche');
else if (intent === 'refactor')
  add('refactor-existing-code', 'preservar comportamiento y contratos');
if (!reviewOnly && !decisionRequired) {
  if (signals.web) {
    add('web-mfe-build-feature', 'React detectado');
    add('web-mfe-contracts', 'contratos frontend');
    add('web-mfe-testing', 'testing web');
  }
  if (signals.nestjs) {
    add('node-nest-build-feature', 'NestJS detectado');
    add('node-nest-testing', 'testing backend');
  }
  if (signals.php) {
    add('php-laravel-build-feature', 'Composer/PHP detectado');
    add('php-laravel-testing', 'testing PHP');
  }
  const security = test(
    /login|auth|autoriz|roles|rbac|sesion|permiso|token|segurid|credencial|contrasena/,
  );
  const persistence = test(
    /sql|database|base de datos|migraci|repositorio|persist|crud|producto|endoso|polimorf|polymorph|morphto|morphmany|relacion|tabla|constraint|foreign key|tenant|indice/,
  );
  if (security && signals.nestjs) add('node-nest-security', 'auth NestJS');
  if (security && signals.php) add('php-laravel-security', 'auth Laravel');
  if (security && signals.web) add('web-mfe-security-delivery', 'frontend security');
  if (persistence && signals.nestjs) add('node-nest-persistence', 'DB NestJS');
  if (persistence && signals.php) add('php-laravel-persistence', 'DB Laravel');
}
// Native base rules are explicit about scope and never pick Qt/GPUI merely from a word in the task.
if (!reviewOnly && !decisionRequired) {
  if (useRust) {
    add('rust-workspace-architecture', 'Cargo workspace detectado');
    if (intent === 'feature' || intent === 'bug' || intent === 'refactor')
      add('rust-native-build-feature', 'feature Rust');
    add('rust-native-testing', 'tests de Cargo');
    if (test(/permiso|segurid|agent|agente|ipc|terminal|pty|file|fs|sandbox/))
      add('rust-agent-runtime-security', 'riesgo nativo');
    if (intent === 'release') add('rust-native-delivery', 'CI/release Rust');
  }
  if (useCpp) {
    add('cpp-workspace-architecture', 'CMake/C++ detectado');
    if (intent === 'feature' || intent === 'bug' || intent === 'refactor')
      add('cpp-native-build-feature', 'feature C++');
    add('cpp-native-testing', 'tests CTest/Qt');
    if (test(/permiso|segurid|memory|memoria|symlink|path|sandbox|privad|incognito/))
      add('cpp-native-security', 'riesgo nativo');
    if (signals.webengine) add('cpp-qt-webengine', 'Qt WebEngine real');
    if (intent === 'release') add('cpp-native-delivery', 'CI/release C++');
  }
}
// Opt-in metadata for ANY FUTURE SKILL; not a fixed allowlist of technologies.
// Requires relevant keyword and ecosystem match (if declared), with file signals for review.
let entries = [];
try {
  entries = fs.readdirSync(skillsDir, { withFileTypes: true });
} catch {
  /* empty */
}
for (const entry of entries) {
  if (!entry.isDirectory() || selected.has(entry.name)) continue;
  const skillPath = path.join(skillsDir, entry.name, 'SKILL.md');
  let content = '';
  try {
    content = fs.readFileSync(skillPath, 'utf8');
  } catch {
    continue;
  }
  const keywords = parseMeta(content, 'routing_keywords'),
    ecosystems = parseMeta(content, 'routing_ecosystems'),
    files = parseMeta(content, 'routing_files'),
    caps = parseMeta(content, 'routing_capabilities');
  if (!keywords.length && !ecosystems.length && !files.length) continue;
  if (reviewOnly) continue;
  const generic = new Set([
    'feature',
    'funcionalidad',
    'app',
    'software',
    'proyecto',
    'build',
    'test',
    'testing',
    'architecture',
    'arquitectura',
    'rust',
    'cpp',
    'qt',
    'godot',
    'juego',
    'videojuego',
    '2d',
    '3d',
  ]);
  const matchedKws = keywords.filter(
    (k) => k.length > 2 && keywordMatches(words, k) && !generic.has(k),
  );
  const kwMatch = matchedKws.length > 0;
  const gameIdea =
    !projectFound && test(/\b(videojuego|videojuegos|juego|juegos|game|godot|bevy)\b/);
  const isCrossStack = ecosystems.includes('cross-stack');
  const ecoMatch =
    ecosystems.length === 0 ||
    isCrossStack ||
    ecosystems.some((e) => stack.has(e) || e === 'any') ||
    (!projectFound && (kwMatch || gameIdea));
  const fileMatch = files.some((f) => hasSignal(f));
  const capMatch =
    caps.length === 0 ||
    caps.some((c) => {
      if (c === 'delivery') return intent === 'release';
      if (c === 'testing')
        return (
          intent === 'test' ||
          (signals.godot && ['feature', 'bug', 'refactor'].includes(intent)) ||
          (kwMatch && test(/test|prueba|e2e/))
        );
      if (c === 'webengine')
        return signals.webengine || (test(/navegador|browser|webengine|chromium/) && signals.qt);
      if (c === 'security')
        return test(/segurid|permission|permiso|sandbox|privad|incognito|auth|login/);
      if (c === 'architecture')
        return (
          intent === 'architecture' ||
          (signals.godot && ['feature', 'bug', 'refactor'].includes(intent)) ||
          kwMatch
        );
      if (c === 'audio') return test(/audio|musica|sfx|sonido|animacion|vfx|particul|salto|saltar/);
      if (c === 'networking')
        return test(
          /online|backend|api|login|multijugador|multiplayer|servidor|lobby|leaderboard|pago|http/,
        );
      if (c === 'feature') return intent === 'feature' || intent === 'architecture' || kwMatch;
      return true;
    });
  if (!ecoMatch || !capMatch) continue;
  let crossStackScore = 0;
  if (isCrossStack) {
    const isDocOnly =
      test(/\b(?:notas?|apuntes|borrador|draft)\b/) &&
      !test(/\b(?:politica|enforce|bloqueo|intercepcion|sigkill|seguridad|security)\b/);
    if (!isDocOnly) {
      crossStackScore += matchedKws.length * 3;
    }
    if (fileMatch) crossStackScore += 4;
    if (caps.some((c) => keywordMatches(words, c))) crossStackScore += 2;
  }
  const crossStackActivated = isCrossStack ? crossStackScore >= 5 : true;
  if (isCrossStack && !crossStackActivated) continue;
  // On greenfield ideas, only architecture candidates; test/release/build come after choosing a motor.
  if (noCodePlan && !caps.includes('architecture')) {
    // Future specialized engines may appear as candidates on an explicit no-repo request,
    // but generic visual/platform capabilities must wait for a stack decision.
    const genericPlatforms = new Set([
      'any',
      'gpui',
      'qt',
      'mobile',
      'expo',
      'react',
      'web',
      'godot',
      'game',
      'cpp',
    ]);
    const explicitFuture =
      kwMatch &&
      ecosystems.length > 0 &&
      ecosystems.every((e) => !genericPlatforms.has(e)) &&
      keywords.some((k) => k.length >= 4 && words.includes(k) && !generic.has(k));
    if (!explicitFuture) continue;
  }
  const baselineGodot =
    signals.godot &&
    fileMatch &&
    !decisionRequired &&
    ((caps.includes('architecture') &&
      ['architecture', 'feature', 'bug', 'refactor'].includes(intent)) ||
      (caps.includes('feature') && ['feature', 'bug', 'refactor'].includes(intent)) ||
      (caps.includes('testing') && ['test', 'feature', 'bug', 'refactor'].includes(intent)) ||
      (caps.includes('delivery') && intent === 'release'));
  if (
    (!projectFound && gameIdea && caps.includes('architecture')) ||
    (kwMatch && ecoMatch && (!ambiguousNative || !projectFound)) ||
    baselineGodot ||
    (fileMatch && ecoMatch && intent === 'test' && !decisionRequired)
  ) {
    add(
      entry.name,
      projectFound
        ? 'metadata declarativa: proyecto/keyword/ecosistema'
        : 'idea nueva: skill candidata (no ejecutada; stack sujeto a decisión)',
    );
  }
}
if (!reviewOnly && !decisionRequired && intent !== 'test')
  add('review-code-change', 'revisión posterior obligatoria, sin editar');
const result = {
  task,
  intent,
  project_found: projectFound,
  scope: requestedScope || null,
  decision_required: decisionRequired,
  detected: {
    godot: signals.godot,
    nestjs: signals.nestjs,
    web: signals.web,
    mobile: signals.mobile,
    php: signals.php,
    reactHookForm: signals.rhf,
    rust: signals.rust,
    cpp: signals.cpp,
    c: signals.c,
    mixed_native: ambiguousNative,
    qt: signals.qt,
    webengine: signals.webengine,
    gpui: signals.gpui,
    cli: signals.cli,
    backend: signals.backend,
    manifests: signals.files.filter((f) =>
      /(Cargo\.toml|CMakeLists\.txt|package\.json|composer\.json|project\.godot)$/.test(f),
    ),
  },
  inventory_source: source,
  suggestions_only: true,
  state: 'PROPOSED_NOT_LOADED',
  selected: [...selected.values()],
  missing: [...missing],
  canonical_sources_read: [],
  tests: 'NOT_RUN',
  review: 'NOT_RUN',
  recommendation: noCodePlan
    ? 'Idea sin repositorio: comparar stacks según requisitos, seguridad, OS, presupuesto, tiempo, equipo, ecosistema y regulación; proponer skills candidatas sin ejecutarlas.'
    : ambiguousNative
      ? 'Monorepo multistack: indicar --scope o lenguaje/módulo propietario antes de sugerir implementación.'
      : !projectFound && intent === 'feature'
        ? 'No hay repositorio: identificar stack, producto y alcance; recomendar diseño y pedir únicamente decisiones bloqueantes antes de implementar.'
        : null,
  note: 'Este proceso NO leyó ni ejecutó SKILL.md: el agente debe abrir cada skill y fuentes canónicas aplicables; CI independiente verifica resultados.',
};
console.log(JSON.stringify(result, null, 2));
