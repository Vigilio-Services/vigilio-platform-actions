# Vigilio Skills

Skills are synchronized explicitly; package installation never writes into the consumer. Profiles
prevent backend-specific knowledge from being installed into web, mobile, or desktop projects.

The synchronizer is authored in strict TypeScript and publishes compiled ESM JavaScript plus type
declarations. Skill assets remain immutable package data and are not executable source.

```bash
pnpm exec vigilio-skills sync --profile core --profile node-nest --profile openspec
pnpm exec vigilio-skills check --profile core --profile node-nest --profile openspec
```

The default target is `.opencode/skills`. Use `--target .agents/skills` for another agent runtime.
Synchronization tracks SHA-256 hashes in `.vigilio-manifest.json`, refuses local conflicts and prunes
only files previously managed by this package. Use `--force` only after reviewing the diff.
