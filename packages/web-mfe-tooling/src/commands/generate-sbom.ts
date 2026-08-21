import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { option, type ParsedArgs } from '../args.js';
import { loadConfig } from '../config.js';

type PackageJson = {
  readonly dependencies?: Readonly<Record<string, string>>;
  readonly devDependencies?: Readonly<Record<string, string>>;
  readonly name?: string;
  readonly version?: string;
};

export function generateSbom(args: ParsedArgs): void {
  const config = loadConfig(args).sbom;
  const toolingPackage = JSON.parse(
    readFileSync(new URL('../../package.json', import.meta.url), 'utf8'),
  ) as PackageJson;
  const packageJsonPath = resolve(
    option(args, 'package-json') ?? config?.packageJson ?? 'package.json',
  );
  const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf8')) as PackageJson;
  const outputPath = resolve(
    option(args, 'output') ?? args.positionals[0] ?? config?.output ?? 'reports/sbom.cdx.json',
  );
  const includeDevDependencies =
    option(args, 'include-dev') === undefined
      ? (config?.includeDevDependencies ?? true)
      : option(args, 'include-dev') === 'true';
  const dependencies = {
    ...packageJson.dependencies,
    ...(includeDevDependencies ? packageJson.devDependencies : {}),
  };
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
      component: {
        name: packageJson.name,
        type: 'application',
        version: packageJson.version,
      },
      tools: [{ name: 'vigilio-web', vendor: 'Vigilio', version: toolingPackage.version }],
    },
    specVersion: '1.6',
    version: 1,
  };

  mkdirSync(dirname(outputPath), { recursive: true });
  writeFileSync(outputPath, `${JSON.stringify(sbom, null, 2)}\n`);
  console.log(`SBOM generated with ${components.length} direct dependencies.`);
}
