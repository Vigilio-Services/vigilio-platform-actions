export type ParsedArgs = {
  readonly options: ReadonlyMap<string, string>;
  readonly positionals: readonly string[];
};

export function parseArgs(input: readonly string[]): ParsedArgs {
  const options = new Map<string, string>();
  const positionals: string[] = [];

  for (let index = 0; index < input.length; index += 1) {
    const token = input[index];
    if (!token) continue;

    if (!token.startsWith('--')) {
      positionals.push(token);
      continue;
    }

    const [rawKey, inlineValue] = token.slice(2).split('=', 2);
    if (!rawKey) continue;

    const next = input[index + 1];
    const value = inlineValue ?? (next && !next.startsWith('--') ? next : 'true');
    if (inlineValue === undefined && value === next) index += 1;
    options.set(rawKey, value);
  }

  return { options, positionals };
}

export function option(args: ParsedArgs, name: string, fallback?: string): string | undefined {
  return args.options.get(name) ?? fallback;
}

export function requiredOption(args: ParsedArgs, name: string): string {
  const value = option(args, name);
  if (!value) throw new Error(`--${name} is required.`);
  return value;
}
