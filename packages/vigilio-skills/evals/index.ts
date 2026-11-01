import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { holdoutRoutingCases, trainingRoutingCases } from './cases/routing-cases.js';
import { runFixtureEvals } from './fixture-eval-runner.js';
import { dataReliabilityFixtureCases } from './fixtures/backup-pitr/fixture-cases.js';
import { observabilityFixtureCases } from './fixtures/observability/fixture-cases.js';
import { runRoutingEvals } from './routing-eval-runner.js';
import type { FullEvalReport } from './types.js';

const packageRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const repoRoot = path.resolve(packageRoot, '..', '..');
const reportsDir = path.join(repoRoot, 'reports');

export async function executeFullEvalSuite(): Promise<FullEvalReport> {
  const routingSummary = await runRoutingEvals(trainingRoutingCases, holdoutRoutingCases);
  const allFixtures = [...observabilityFixtureCases, ...dataReliabilityFixtureCases];
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
