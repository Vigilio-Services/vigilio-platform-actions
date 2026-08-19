import { describe, expect, it } from 'vitest';
import { option, parseArgs, requiredOption } from '../src/args.js';

describe('CLI arguments', () => {
  it('parses positionals, inline options, values and flags', () => {
    const args = parseArgs([
      'target',
      '--url=https://example.com',
      '--stage',
      'production',
      '--ci',
    ]);

    expect(args.positionals).toEqual(['target']);
    expect(option(args, 'url')).toBe('https://example.com');
    expect(option(args, 'stage')).toBe('production');
    expect(option(args, 'ci')).toBe('true');
  });

  it('requires named options', () => {
    expect(() => requiredOption(parseArgs([]), 'url')).toThrow('--url is required.');
  });
});
