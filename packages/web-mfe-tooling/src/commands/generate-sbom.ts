import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { option, type ParsedArgs } from '../args.js';

export function generateSbom(args: ParsedArgs): void {
  const toolingPackage = JSON.parse(
    readFileSync(new URL('../../package.json', import.meta.url), 'utf8'),
  ) as { readonly version?: string };
  const packageJson = JSON.parse(readFileSync('package.json', 'utf8')) as {
    readonly name?: string;
    readonly version?: string;
    readonly dependencies?: Record<string, string>;
    readonly devDependencies?: Record<string, string>;
  };
  const outputPath = resolve(
    option(args, 'output') ?? args.positionals[0] ?? 'reports/sbom.cdx.json',
  );
  const dependencies = { ...packageJson.dependencies, ...packageJson.devDependencies };
  const components = Object.entries(dependencies)
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([name, version]) => ({
      bomRef: `pkg:npm/${name}@${version}`,
      name,
      purl: `pkg:npm/${encodeURIComponent(name)}@${encodeURIComponent(version)}`,
      type: 'library',
      version,
    }));
  const sbom = {
    $schema: 'http://cyclonedx.org/schema/bom-1.6.schema.json',
    bomFormat: 'CycloneDX',
    components,
    metadata: {
      component: { name: packageJson.name, type: 'application', version: packageJson.version },
      tools: [{ name: 'vigilio-web', vendor: 'Vigilio', version: toolingPackage.version }],
    },
    specVersion: '1.6',
    version: 1,
  };
  mkdirSync(dirname(outputPath), { recursive: true });
  writeFileSync(outputPath, `${JSON.stringify(sbom, null, 2)}\n`);
  console.log(`SBOM generated with ${components.length} direct dependencies.`);
}
