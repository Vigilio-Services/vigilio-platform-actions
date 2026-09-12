---
name: mobile-mfe-security-delivery
description: Review Expo and React Native security, secrets, permissions, deep links, native storage, dependency supply chain, EAS builds, OTA updates, signing, SBOMs, and environment promotion. Use for authentication, SecureStore, uploads, app configuration, native permissions, CI workflows, EAS profiles, release channels, certificates, or production delivery changes.
---

# Mobile MFE Security And Delivery

## Lectura obligatoria de referencias

Antes de actuar, leer de principio a fin cada archivo `references/*` enlazado por esta skill. Dentro
de cada referencia aplicable, abrir y leer completas todas las fuentes canónicas enlazadas; no basta
con leer títulos, tablas o resúmenes. Si una fuente requerida no es accesible, identificarla y no
afirmar cumplimiento ni cerrar el gate que dependa de ella.

Treat the shipped client as public and make every promotion attributable and reversible.

## Workflow

1. Threat-model the changed data, native capability, trust boundary, and abuse path.
2. Apply [references/security-delivery-checklist.md](references/security-delivery-checklist.md).
3. Keep secrets server-side. Store only unavoidable session material behind SecureStore and clear it on logout/revocation.
4. Minimize native permissions and request them just in time.
5. Validate deep-link inputs, redirect allowlists, file metadata, and backend authorization.
6. Pin CI actions, minimize token permissions, generate an SBOM, scan dependencies/secrets, and retain provenance.
7. Build immutable environment profiles. Promote the same reviewed source/artifact identity through approvals.
8. Define OTA runtime compatibility, rollout, monitoring, halt, and rollback before enabling production updates.

## Guardrails

- `EXPO_PUBLIC_*` is public configuration, never a secret store.
- Do not embed AWS, Azure, GCP, database, signing, or monitoring administration credentials in the app.
- Do not make the mobile client consume Terraform or cloud provider APIs directly; it consumes stable backend contracts.
- Do not log tokens, PII, presigned URLs, file contents, or sensitive deep-link parameters.
- Do not claim EAS, signing, store submission, OTA rollback, or cloud integration without executing it in the authorized environment.

## Validation

Run repository policy, secrets/SAST/dependency checks, Expo Doctor, export, SBOM generation, and workflow validation. Require real credentials and explicit authorization for signing, EAS builds, submissions, or production promotion.
