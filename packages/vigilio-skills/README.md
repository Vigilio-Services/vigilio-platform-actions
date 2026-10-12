# Vigilio Skills

Skills are synchronized explicitly; package installation never writes into the consumer. Profiles
prevent backend-specific knowledge from being installed into web, mobile, or desktop projects.

The synchronizer is authored in strict TypeScript and publishes compiled ESM JavaScript plus type
declarations. Skill assets remain immutable package data and are not executable source.

The `node-nest` profile includes `backend-engineering-quality`, which routes to the framework-independent
standards owned by `vigilio-docs`. Stack skills retain only operational workflow, libraries, layout and
commands, so future backend profiles can reuse those standards without copying them.

```bash
pnpm exec vigilio-skills sync --profile core --profile node-nest --profile openspec
pnpm exec vigilio-skills check --profile core --profile node-nest --profile openspec
```

Repositorios de plataforma usan capacidades EKS, observabilidad y trazabilidad:

```bash
pnpm exec vigilio-skills sync --profile core --profile platform --profile openspec
pnpm exec vigilio-skills check --profile core --profile platform --profile openspec
```

Expo/React Native repositories use the isolated mobile profile:

```bash
pnpm exec vigilio-skills sync --profile core --profile mobile-mfe --profile openspec
pnpm exec vigilio-skills sync --target .agents/skills --profile core --profile mobile-mfe --profile openspec
pnpm exec vigilio-skills check --profile core --profile mobile-mfe --profile openspec
pnpm exec vigilio-skills check --target .agents/skills --profile core --profile mobile-mfe --profile openspec
```

The default target is `.opencode/skills`. Use `--target .agents/skills` for another agent runtime.
Synchronization tracks SHA-256 hashes in `.vigilio-manifest.json`, refuses local conflicts and prunes
only files previously managed by this package. Use `--force` only after reviewing the diff.
