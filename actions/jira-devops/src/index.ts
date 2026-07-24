const ISSUE_KEY_PATTERN = /\b[A-Z][A-Z0-9]+-\d+\b/g;

interface JiraCredentials {
  readonly authorization: string;
  readonly baseUrl: string;
}

interface JiraRequestOptions {
  readonly body?: unknown;
  readonly headers?: Readonly<Record<string, string>>;
  readonly method?: string;
}

interface JiraTransition {
  readonly id: string;
  readonly name: string;
}

interface JiraVersion {
  readonly id: string;
  readonly name: string;
}

interface JiraIssue {
  readonly key: string;
}

function read(name: string, fallback = ''): string {
  return process.env[name] ?? fallback;
}

function enabled(name: string): boolean {
  return ['1', 'true', 'yes'].includes(read(name).toLowerCase());
}

function normalizeBaseUrl(url: string): string {
  return url.replace(/\/+$/, '');
}

function extractIssueKeys(text: string): string[] {
  return [
    ...new Set((text.match(ISSUE_KEY_PATTERN) ?? []).map((issueKey) => issueKey.toUpperCase())),
  ];
}

function toAdf(text: string): Record<string, unknown> {
  const lines = text.split('\n');
  return {
    type: 'doc',
    version: 1,
    content: lines.map((line) => ({
      type: 'paragraph',
      content: line ? [{ type: 'text', text: line }] : [],
    })),
  };
}

function getCredentials(): JiraCredentials | null {
  const baseUrl = read('JIRA_BASE_URL');
  const email = read('JIRA_USER_EMAIL');
  const token = read('JIRA_API_TOKEN');
  const required = enabled('JIRA_REQUIRED');

  if (!baseUrl || !email || !token) {
    const message =
      'Jira credentials are not configured. Set JIRA_BASE_URL, JIRA_USER_EMAIL, and JIRA_API_TOKEN.';
    if (required) {
      throw new Error(message);
    }
    console.log(`SKIP: ${message}`);
    return null;
  }

  return {
    baseUrl: normalizeBaseUrl(baseUrl),
    authorization: `Basic ${Buffer.from(`${email}:${token}`).toString('base64')}`,
  };
}

async function jiraFetch<T>(
  credentials: JiraCredentials,
  requestPath: string,
  options: JiraRequestOptions = {},
): Promise<T> {
  const response = await fetch(`${credentials.baseUrl}${requestPath}`, {
    method: options.method ?? 'GET',
    headers: {
      Authorization: credentials.authorization,
      Accept: 'application/json',
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...(options.body === undefined ? {} : { body: JSON.stringify(options.body) }),
  });

  const text = await response.text();
  const body: unknown = text ? JSON.parse(text) : null;

  if (!response.ok) {
    const detail = body ? JSON.stringify(body) : text;
    throw new Error(`Jira API ${response.status} ${response.statusText}: ${detail}`);
  }

  return body as T;
}

async function addComment(
  credentials: JiraCredentials,
  issueKey: string,
  comment: string,
  dryRun: boolean,
): Promise<void> {
  if (!comment.trim()) {
    return;
  }

  if (dryRun) {
    console.log(`DRY RUN: comment ${issueKey}: ${comment}`);
    return;
  }

  await jiraFetch<void>(credentials, `/rest/api/3/issue/${issueKey}/comment`, {
    method: 'POST',
    body: { body: toAdf(comment) },
  });
  console.log(`Jira comment added to ${issueKey}`);
}

async function transitionIssue(
  credentials: JiraCredentials,
  issueKey: string,
  transitionName: string,
  comment: string,
  dryRun: boolean,
): Promise<void> {
  if (!transitionName.trim()) {
    return;
  }

  if (dryRun) {
    console.log(`DRY RUN: transition ${issueKey} -> ${transitionName}`);
    return;
  }

  const transitions = await jiraFetch<{ readonly transitions: readonly JiraTransition[] }>(
    credentials,
    `/rest/api/3/issue/${issueKey}/transitions`,
  );
  const transition = transitions.transitions.find(
    (candidate) => candidate.name.toLowerCase() === transitionName.toLowerCase(),
  );

  if (!transition) {
    const names = transitions.transitions.map((candidate) => candidate.name).join(', ');
    throw new Error(
      `Transition "${transitionName}" is not available for ${issueKey}. Available: ${names}`,
    );
  }

  const body = {
    transition: { id: transition.id },
    ...(comment.trim()
      ? {
          update: {
            comment: [{ add: { body: toAdf(comment) } }],
          },
        }
      : {}),
  };

  await jiraFetch<void>(credentials, `/rest/api/3/issue/${issueKey}/transitions`, {
    method: 'POST',
    body,
  });
  console.log(`Jira issue ${issueKey} transitioned to ${transitionName}`);
}

function deploymentEnvironmentType(
  environment: string,
): 'production' | 'staging' | 'testing' | 'development' {
  const value = environment.toLowerCase();
  if (value.includes('prod')) return 'production';
  if (value.includes('stag') || value.includes('pre')) return 'staging';
  if (value.includes('test') || value.includes('qa')) return 'testing';
  return 'development';
}

async function registerOfficialDeployment(
  credentials: JiraCredentials,
  issueKeys: readonly string[],
  dryRun: boolean,
): Promise<void> {
  const environment = read('ENVIRONMENT_NAME');
  const appName = read('APP_NAME', 'app');
  const pipelineUrl = read('PIPELINE_URL');
  const deploymentUrl = read('DEPLOYMENT_URL') || pipelineUrl;
  const deploymentId =
    read('DEPLOYMENT_ID') || `${appName}-${environment}-${read('COMMIT_SHA') || Date.now()}`;
  const deploymentName = read('DEPLOYMENT_NAME') || `${appName} ${environment}`;
  const now = new Date().toISOString();

  const body = {
    deployments: [
      {
        schemaVersion: '1.0',
        deploymentSequenceNumber: Date.now(),
        updateSequenceNumber: Date.now(),
        displayName: deploymentName,
        description: `${appName} deployed to ${environment}`,
        url: deploymentUrl,
        state: read('DEPLOYMENT_STATE', 'successful'),
        lastUpdated: now,
        pipeline: {
          id: `${appName}-${environment}`,
          displayName: `${appName} ${environment} pipeline`,
          url: pipelineUrl,
        },
        environment: {
          id: environment || 'unknown',
          displayName: environment || 'unknown',
          type: deploymentEnvironmentType(environment),
        },
        associations: [
          {
            associationType: 'issueKeys',
            values: issueKeys,
          },
        ],
        commands: [
          {
            command: 'initiate_deployment_gating',
            displayName: 'Open pipeline',
            url: pipelineUrl,
          },
        ].filter((command) => command.url),
        deploymentProperties: {
          appName,
          deploymentId,
          repo: read('REPO'),
          commitSha: read('COMMIT_SHA'),
        },
      },
    ],
  };

  if (dryRun) {
    console.log(`DRY RUN: official Jira deployment payload ${JSON.stringify(body, null, 2)}`);
    return;
  }

  await jiraFetch<void>(credentials, '/rest/deployments/0.1/bulk', {
    method: 'POST',
    body,
  });
  console.log(`Jira deployment registered for ${issueKeys.join(', ')}`);
}

async function deploymentMode(
  credentials: JiraCredentials,
  issueKeys: readonly string[],
  dryRun: boolean,
): Promise<void> {
  if (issueKeys.length === 0) {
    console.log('SKIP: no Jira issue keys found for deployment.');
    return;
  }

  if (enabled('OFFICIAL_DEPLOYMENTS_API')) {
    try {
      await registerOfficialDeployment(credentials, issueKeys, dryRun);
      return;
    } catch (error) {
      if (!enabled('FALLBACK_COMMENT')) {
        throw error;
      }
      console.log(
        `WARN: official Jira deployments API failed, using comments fallback. ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
    }
  }

  if (!enabled('FALLBACK_COMMENT')) {
    return;
  }

  const comment = [
    `${read('APP_NAME', 'app')} deployed to ${read('ENVIRONMENT_NAME', 'unknown')}.`,
    `State: ${read('DEPLOYMENT_STATE', 'successful')}`,
    read('DEPLOYMENT_URL') ? `Environment: ${read('DEPLOYMENT_URL')}` : '',
    read('PIPELINE_URL') ? `Pipeline: ${read('PIPELINE_URL')}` : '',
    read('COMMIT_SHA') ? `Commit: ${read('COMMIT_SHA')}` : '',
  ]
    .filter(Boolean)
    .join('\n');

  await Promise.all(
    issueKeys.map((issueKey) => addComment(credentials, issueKey, comment, dryRun)),
  );
}

async function transitionMode(
  credentials: JiraCredentials,
  issueKeys: readonly string[],
  dryRun: boolean,
): Promise<void> {
  if (issueKeys.length === 0) {
    console.log('SKIP: no Jira issue keys found for transition.');
    return;
  }

  const transitionName = read('TRANSITION_NAME');
  const comment = read('COMMENT');
  await Promise.all(
    issueKeys.map((issueKey) =>
      transitionIssue(credentials, issueKey, transitionName, comment, dryRun),
    ),
  );
}

async function releaseMode(
  credentials: JiraCredentials,
  issueKeys: readonly string[],
  dryRun: boolean,
): Promise<void> {
  const projectKey = read('PROJECT_KEY');
  const version = read('VERSION');

  if (!projectKey || !version) {
    throw new Error('release mode requires project-key and version.');
  }

  if (issueKeys.length === 0) {
    console.log('SKIP: no Jira issue keys found for release.');
    return;
  }

  if (dryRun) {
    console.log(
      `DRY RUN: create/update Jira version ${projectKey}/${version} and assign ${issueKeys.join(', ')}`,
    );
    return;
  }

  const versions = await jiraFetch<readonly JiraVersion[]>(
    credentials,
    `/rest/api/3/project/${projectKey}/versions`,
  );
  let targetVersion = versions.find((candidate) => candidate.name === version);

  if (!targetVersion) {
    targetVersion = await jiraFetch<JiraVersion>(credentials, '/rest/api/3/version', {
      method: 'POST',
      body: {
        name: version,
        project: projectKey,
        released: false,
      },
    });
    console.log(`Jira version ${version} created`);
  }

  await Promise.all(
    issueKeys.map((issueKey) =>
      jiraFetch<void>(credentials, `/rest/api/3/issue/${issueKey}`, {
        method: 'PUT',
        body: {
          update: {
            fixVersions: [{ add: { name: version } }],
          },
        },
      }),
    ),
  );
  console.log(`Jira Fix Version ${version} assigned to ${issueKeys.join(', ')}`);

  if (enabled('RELEASE_VERSION')) {
    await jiraFetch<void>(credentials, `/rest/api/3/version/${targetVersion.id}`, {
      method: 'PUT',
      body: {
        released: true,
        releaseDate: new Date().toISOString().slice(0, 10),
      },
    });
    console.log(`Jira version ${version} marked as released`);
  }
}

async function incidentMode(credentials: JiraCredentials, dryRun: boolean): Promise<void> {
  const projectKey = read('PROJECT_KEY');
  if (!projectKey) {
    throw new Error('incident mode requires project-key.');
  }

  const summary =
    read('INCIDENT_SUMMARY') || `Production deployment failed: ${read('APP_NAME', 'app')}`;
  const description =
    read('INCIDENT_DESCRIPTION') || 'A production deployment or operational gate failed.';
  const fields = {
    project: { key: projectKey },
    summary,
    description: toAdf(description),
    issuetype: { name: read('INCIDENT_ISSUE_TYPE', 'Bug') },
    priority: { name: read('INCIDENT_PRIORITY', 'Highest') },
    ...(read('INCIDENT_ASSIGNEE_ACCOUNT_ID')
      ? { assignee: { accountId: read('INCIDENT_ASSIGNEE_ACCOUNT_ID') } }
      : {}),
  };

  if (dryRun) {
    console.log(`DRY RUN: create Jira incident ${JSON.stringify(fields, null, 2)}`);
    return;
  }

  const issue = await jiraFetch<JiraIssue>(credentials, '/rest/api/3/issue', {
    method: 'POST',
    body: { fields },
  });
  console.log(`Jira incident created: ${issue.key}`);
}

function parseSmartCommit(message: string): {
  readonly comment: string;
  readonly issueKeys: string[];
  readonly timeSpent: string;
} {
  const issueKeys = extractIssueKeys(message);
  const comment = message.match(/#comment\s+(.+?)(?=\s+#\w+|$)/i)?.[1]?.trim() ?? '';
  const timeSpent = message.match(/#time\s+(.+?)(?=\s+#\w+|$)/i)?.[1]?.trim() ?? '';
  return { issueKeys, comment, timeSpent };
}

async function smartCommitMode(credentials: JiraCredentials, dryRun: boolean): Promise<void> {
  const parsed = parseSmartCommit(read('SMART_COMMIT_MESSAGE'));
  if (parsed.issueKeys.length === 0) {
    console.log('SKIP: smart commit has no Jira issue key.');
    return;
  }

  for (const issueKey of parsed.issueKeys) {
    if (parsed.comment) {
      await addComment(credentials, issueKey, parsed.comment, dryRun);
    }

    if (parsed.timeSpent) {
      if (dryRun) {
        console.log(`DRY RUN: add worklog ${issueKey}: ${parsed.timeSpent}`);
      } else {
        await jiraFetch<void>(credentials, `/rest/api/3/issue/${issueKey}/worklog`, {
          method: 'POST',
          body: {
            timeSpent: parsed.timeSpent,
            comment: toAdf(`Work logged from smart commit: ${read('SMART_COMMIT_MESSAGE')}`),
          },
        });
        console.log(`Jira worklog added to ${issueKey}`);
      }
    }
  }
}

async function featureFlagMode(
  credentials: JiraCredentials,
  issueKeys: readonly string[],
  dryRun: boolean,
): Promise<void> {
  if (issueKeys.length === 0) {
    console.log('SKIP: no Jira issue keys found for feature flag update.');
    return;
  }

  const flagKey = read('FEATURE_FLAG_KEY');
  const rollout = read('ROLLOUT_PERCENTAGE');
  const comment = `Feature flag ${flagKey || 'unknown'} rollout is ${rollout || 'unknown'}%.`;
  await Promise.all(
    issueKeys.map((issueKey) => addComment(credentials, issueKey, comment, dryRun)),
  );

  if (rollout === '100' && read('DONE_TRANSITION_NAME')) {
    await Promise.all(
      issueKeys.map((issueKey) =>
        transitionIssue(credentials, issueKey, read('DONE_TRANSITION_NAME'), comment, dryRun),
      ),
    );
  }
}

async function main(): Promise<void> {
  const mode = read('MODE');
  const dryRun = enabled('DRY_RUN');
  const credentials = getCredentials();
  if (!credentials) {
    return;
  }

  const issueKeys = extractIssueKeys(
    [
      read('ISSUE_KEYS'),
      read('SMART_COMMIT_MESSAGE'),
      read('DEPLOYMENT_NAME'),
      read('COMMENT'),
      read('INCIDENT_DESCRIPTION'),
    ].join('\n'),
  );

  if (mode === 'deployment') {
    await deploymentMode(credentials, issueKeys, dryRun);
    return;
  }

  if (mode === 'transition') {
    await transitionMode(credentials, issueKeys, dryRun);
    return;
  }

  if (mode === 'release') {
    await releaseMode(credentials, issueKeys, dryRun);
    return;
  }

  if (mode === 'incident') {
    await incidentMode(credentials, dryRun);
    return;
  }

  if (mode === 'smart-commit') {
    await smartCommitMode(credentials, dryRun);
    return;
  }

  if (mode === 'feature-flag') {
    await featureFlagMode(credentials, issueKeys, dryRun);
    return;
  }

  throw new Error(`Unsupported Jira DevOps mode: ${mode}`);
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});
