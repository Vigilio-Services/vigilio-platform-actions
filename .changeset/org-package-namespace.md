---
"@vigilio-services/devsecops-evidence": patch
"@vigilio-services/devsecops-governance": patch
"@vigilio-services/node-nest-tooling": patch
"@vigilio-services/prompt-builder": patch
"@vigilio-services/vigilio-skills": patch
"@vigilio-services/web-mfe-tooling": patch
---

Move the platform packages to the organization-owned `@vigilio-services` namespace so the repository-scoped `GITHUB_TOKEN` can publish them without a broad personal access token. Existing `@vigilioyonatan` releases remain available during consumer migration.
