import { option, type ParsedArgs } from '../args.js';

export async function validateSecurityHeaders(args: ParsedArgs): Promise<void> {
  const targetUrl = option(args, 'url') ?? args.positionals[0] ?? process.env['APP_BASE_URL'];
  if (!targetUrl) throw new Error('APP_BASE_URL, --url or a URL argument is required.');
  const url = new URL(targetUrl);
  const response = await fetch(url, {
    headers: { Accept: 'text/html' },
    redirect: 'follow',
    signal: AbortSignal.timeout(15_000),
  });
  if (!response.ok)
    throw new Error(`Remote smoke failed: ${response.status} ${response.statusText}`);
  const requiredHeaders: readonly [string, RegExp][] = [
    ['content-security-policy', /default-src\s+'self'/],
    ['permissions-policy', /.+/],
    ['referrer-policy', /^(no-referrer|strict-origin|strict-origin-when-cross-origin)$/],
    ['x-content-type-options', /^nosniff$/],
    ['x-robots-tag', /\bnoindex\b.*\bnofollow\b/i],
  ];
  const errors = requiredHeaders.flatMap(([name, pattern]) => {
    const value = response.headers.get(name);
    return value && pattern.test(value)
      ? []
      : [`${name}: missing or invalid (${value ?? 'missing'})`];
  });
  if (url.protocol === 'https:') {
    const hsts = response.headers.get('strict-transport-security');
    if (!hsts || !/max-age=(?:[3-9]\d{7}|[1-9]\d{8,})/.test(hsts))
      errors.push('strict-transport-security: HTTPS requires max-age >= 30000000');
  }
  if (errors.length > 0)
    throw new Error(
      ['Security header validation failed:', ...errors.map((error) => `- ${error}`)].join('\n'),
    );
  console.log(`Remote smoke and security headers validated: ${response.url}`);
}
