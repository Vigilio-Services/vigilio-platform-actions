---
"@vigilio-services/prompt-builder": patch
---

Publish `build-all` outputs as an exact guarded directory snapshot so stale owned prompts and lockfiles cannot remain
in a regenerated plan. Refuse to replace directories containing unowned files and restore the prior output if the
atomic directory swap fails.

Make runtime preflight UI checks truly profile-driven and consume the same explicitly exported local Prompt Builder
CLI used by the Python adapter, avoiding false asset failures during docs-only generation.
