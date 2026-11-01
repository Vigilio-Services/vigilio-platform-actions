import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { holdoutRoutingCases, trainingRoutingCases } from './cases/routing-cases.js';
import { runFixtureEvals } from './fixture-eval-runner.js';
import { AWS_FOUNDATION_FIXTURES } from './fixtures/aws-foundation/fixture-cases.js';
import { dataReliabilityFixtureCases } from './fixtures/backup-pitr/fixture-cases.js';
import { FINOPS_FIXTURES } from './fixtures/finops/fixture-cases.js';
import { GITOPS_FIXTURES } from './fixtures/gitops/fixture-cases.js';
import { observabilityFixtureCases } from './fixtures/observability/fixture-cases.js';
import { ONPREM_FOUNDATION_FIXTURES } from './fixtures/onprem-foundation/fixture-cases.js';
import { PROMOTION_FIXTURES } from './fixtures/promotion/fixture-cases.js';
import { RESILIENCE_FIXTURES } from './fixtures/resilience/fixture-cases.js';
import { runtimeSecurityFixtures } from './fixtures/runtime-security/fixture-cases.js';
import { SCALABILITY_FIXTURES } from './fixtures/scalability/fixture-cases.js';
import { supplyChainFixtures } from './fixtures/supply-chain/fixture-cases.js';
import { TERRAFORM_FIXTURES } from './fixtures/terraform/fixture-cases.js';
import { runRoutingEvals } from './routing-eval-runner.js';
import type { FullEvalReport } from './types.js';

const packageRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const repoRoot = path.resolve(packageRoot, '..', '..');
const reportsDir = path.join(repoRoot, 'reports');

export async function executeFullEvalSuite(): Promise<FullEvalReport> {
  const routingSummary = await runRoutingEvals(trainingRoutingCases, holdoutRoutingCases);
  const allFixtures = [
    ...observabilityFixtureCases,
    ...dataReliabilityFixtureCases,
    ...supplyChainFixtures,
    ...runtimeSecurityFixtures,
    ...GITOPS_FIXTURES,
    ...PROMOTION_FIXTURES,
    ...TERRAFORM_FIXTURES,
    ...AWS_FOUNDATION_FIXTURES,
    ...ONPREM_FOUNDATION_FIXTURES,
    ...SCALABILITY_FIXTURES,
    ...FINOPS_FIXTURES,
    ...RESILIENCE_FIXTURES,
  ];
  const fixtureSummary = runFixtureEvals(allFixtures);

  const routingGatePassed =
    routingSummary.overallMetrics.falsePositives === 0 &&
    routingSummary.overallMetrics.falseNegatives === 0 &&
    routingSummary.overallMetrics.accuracy === 1.0;

  const fixtureGatePassed = fixtureSummary.failed === 0;

  const gateVerdict = routingGatePassed && fixtureGatePassed ? 'PASS' : 'FAIL';

  const fullReport: FullEvalReport = {
    timestamp: new Date().toISOString(),
    routingSummary,
    fixtureSummary,
    gateVerdict,
  };

  try {
    await mkdir(reportsDir, { recursive: true });
    await writeFile(
      path.join(reportsDir, 'routing-eval-summary.json'),
      `${JSON.stringify(fullReport, null, 2)}\n`,
      'utf8',
    );

    const versionedResultsDir = path.join(packageRoot, 'evals', 'results');
    await mkdir(versionedResultsDir, { recursive: true });
    await writeFile(
      path.join(versionedResultsDir, 'routing-eval-summary.json'),
      `${JSON.stringify(fullReport, null, 2)}\n`,
      'utf8',
    );
  } catch {
    // Non-fatal if reports folder cannot be created in restricted environments
  }

  return fullReport;
}
