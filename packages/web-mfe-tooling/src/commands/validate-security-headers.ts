import { option, type ParsedArgs } from '../args.js';
import { compilePattern, loadConfig, type PatternRule } from '../config.js';

export async function validateSecurityHeaders(args: ParsedArgs): Promise<void> {
  const config = loadConfig(args).securityHeaders;
  const targetUrl = option(args, 'url') ?? args.positionals[0] ?? process.env['APP_BASE_URL'];
  if (!targetUrl) throw new Error('APP_BASE_URL, --url or a URL argument is required.');

  const url = new URL(targetUrl);
  const response = await fetch(url, {
    headers: { Accept: 'text/html' },
    redirect: 'follow',
    signal: AbortSignal.timeout(config?.timeoutMs ?? 15_000),
  });
  if (!response.ok) {
    throw new Error(`Remote smoke failed: ${response.status} ${response.statusText}`);
  }

  const defaultHeaders: readonly PatternRule[] = [
    { label: 'content-security-policy', pattern: "default-src\\s+'self'" },
    { label: 'permissions-policy', pattern: '.+' },
    {
      label: 'referrer-policy',
      pattern: '^(no-referrer|strict-origin|strict-origin-when-cross-origin)$',
    },
    { label: 'x-content-type-options', pattern: '^nosniff$' },
    { flags: 'i', label: 'x-robots-tag', pattern: '\\bnoindex\\b.*\\bnofollow\\b' },
  ];
  const requiredHeaders = config ? (config.headers ?? []) : defaultHeaders;
  const errors = requiredHeaders.flatMap((rule) => {
    const value = response.headers.get(rule.label);
    return value && compilePattern(rule).test(value)
      ? []
      : [`${rule.label}: missing or invalid (${value ?? 'missing'})`];
  });

  if (url.protocol === 'https:') {
    const httpsHeaders = config
      ? (config.httpsHeaders ?? [])
      : [
          {
            label: 'strict-transport-security',
            pattern: 'max-age=(?:[3-9]\\d{7}|[1-9]\\d{8,})',
          },
        ];
    for (const rule of httpsHeaders) {
      const value = response.headers.get(rule.label);
      if (!value || !compilePattern(rule).test(value)) {
        errors.push(`${rule.label}: missing or invalid (${value ?? 'missing'})`);
      }
    }
  }

  if (errors.length > 0) {
    throw new Error(
      ['Security header validation failed:', ...errors.map((error) => `- ${error}`)].join('\n'),
    );
  }
  console.log(`Remote smoke and security headers validated: ${response.url}`);
}
