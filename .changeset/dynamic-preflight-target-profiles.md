---
"@vigilio-services/prompt-builder": patch
---

Make generated runtime preflight compatible with desktop and other projects that do not adopt
backend/frontend target profiles, add an explicit target-profile readiness policy, and align the scaffolded
Prompt Builder version dynamically with the package manifest. Allow profiles to validate the same configurable
asset directory passed to the queue runner.
