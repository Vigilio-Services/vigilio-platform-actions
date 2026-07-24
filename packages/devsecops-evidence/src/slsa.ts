export interface SlsaSubject {
  readonly digest: { readonly sha256: string };
  readonly name: string;
}

export interface SlsaProvenanceInput {
  readonly commitSha: string;
  readonly deployMode: string;
  readonly generatedAt?: Date;
  readonly ref: string;
  readonly repository: string;
  readonly runAttempt: string;
  readonly runId: string;
  readonly serverUrl?: string;
  readonly stage: string;
  readonly subjects: readonly SlsaSubject[];
  readonly workflow: string;
}

export function parseSha256Manifest(content: string): SlsaSubject[] {
  const subjects: SlsaSubject[] = [];
  for (const [index, line] of content.split(/\r?\n/).entries()) {
    if (!line.trim()) continue;
    const match = /^([a-fA-F0-9]{64})\s+\*?(.+)$/.exec(line);
    if (!match?.[1] || !match[2]) throw new Error(`Invalid SHA-256 manifest line ${index + 1}`);
    subjects.push({
      name: match[2].replaceAll('\\', '/'),
      digest: { sha256: match[1].toLowerCase() },
    });
  }
  if (subjects.length === 0) throw new Error('SHA-256 manifest must contain at least one subject');
  return subjects;
}

export function createSlsaProvenance(input: SlsaProvenanceInput): Record<string, unknown> {
  if (!input.repository || !/^[a-fA-F0-9]{40}$/.test(input.commitSha)) {
    throw new Error('repository and a 40-character commit SHA are required');
  }
  const serverUrl = input.serverUrl ?? 'https://github.com';
  return {
    _type: 'https://in-toto.io/Statement/v1',
    subject: input.subjects,
    predicateType: 'https://slsa.dev/provenance/v1',
    predicate: {
      buildDefinition: {
        buildType: `${serverUrl}/${input.repository}/blob/${input.commitSha}/${input.workflow}`,
        externalParameters: { deployMode: input.deployMode, stage: input.stage },
        internalParameters: {
          githubRef: input.ref,
          githubRunAttempt: input.runAttempt,
          githubRunId: input.runId,
        },
        resolvedDependencies: [
          {
            uri: `git+${serverUrl}/${input.repository}@${input.ref}`,
            digest: { gitCommit: input.commitSha },
          },
        ],
      },
      runDetails: {
        builder: { id: `${serverUrl}/actions/runner` },
        metadata: {
          invocationId: `${serverUrl}/${input.repository}/actions/runs/${input.runId}/attempts/${input.runAttempt}`,
          startedOn: (input.generatedAt ?? new Date()).toISOString(),
        },
      },
    },
  };
}
