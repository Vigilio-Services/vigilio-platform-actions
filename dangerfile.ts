import { danger, fail, warn } from 'danger';

const { github } = danger;
const pr = github.pr;
const modifiedFiles = danger.git.modified_files;
const createdFiles = danger.git.created_files;
const allFiles = [...modifiedFiles, ...createdFiles];

// 1. Validaciones básicas de higiene del PR
const bigPrThreshold = 400; // Más estricto por ser herramienta Core
if (pr.additions + pr.deletions > bigPrThreshold) {
  warn(
    `Este PR tiene ${pr.additions + pr.deletions} líneas cambiadas. Evita PRs gigantes en herramientas de Plataforma.`,
  );
}

if (!pr.body || pr.body.trim().length < 20) {
  fail(
    'El PR no tiene descripción. Debes explicar qué regla de DevSecOps estás modificando y por qué.',
  );
}

// 2. Control sobre el código fuente de las políticas de validación
const corePolicyChanged = allFiles.some((f) => f.includes('src/') && f.endsWith('-policy.ts'));
if (corePolicyChanged) {
  warn(
    '⚠️ Estás modificando las reglas de validación (Policy). Ten cuidado, este cambio afectará a todos los proyectos que consumen este paquete.',
  );
}

// 3. Tests obligatorios para código nuevo (Coverage Assurance)
const srcChanged = allFiles.some(
  (f) => f.startsWith('packages/devsecops-governance/src/') && f.endsWith('.ts'),
);
const testChanged = allFiles.some(
  (f) =>
    f.startsWith('packages/devsecops-governance/tests/') &&
    (f.endsWith('.test.ts') || f.endsWith('.spec.ts')),
);

if (srcChanged && !testChanged) {
  fail(
    'Has modificado el código fuente pero no veo cambios en la carpeta `tests/`. En este paquete es obligatorio mantener el 95%+ de coverage.',
  );
}

// 4. Recordatorio de Changelog
const changelogChanged = allFiles.includes('CHANGELOG.md');
if (corePolicyChanged && !changelogChanged) {
  warn(
    'Modificaste el código de una política pero no actualizaste el `CHANGELOG.md`. Por favor, documenta el cambio para los consumidores del paquete.',
  );
}

// 5. Bloqueo de secretos
const sensitiveFiles = ['.env', '.npmrc', 'npm_token'];
const hasSensitiveFile = allFiles.some((f) => sensitiveFiles.includes(f) || f.endsWith('.env'));
if (hasSensitiveFile) {
  fail('SECURITY FATAL: Se detectó un archivo que podría contener secretos (.env, .npmrc).');
}
