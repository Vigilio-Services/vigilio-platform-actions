---
name: mobile-mfe-security-delivery
description: Review Expo and React Native security, secrets, permissions, deep links, native storage, dependency supply chain, EAS builds, OTA updates, signing, SBOMs, and environment promotion. Use for authentication, SecureStore, uploads, app configuration, native permissions, CI workflows, EAS profiles, release channels, certificates, or production delivery changes.
owner: mobile-platform
lifecycle: stable
introduced_in: 0.7.0
routing_ecosystems: "mobile, react-native, expo, typescript"
routing_keywords: "react-native, expo, mobile, security-delivery"
routing_files: "app.json, package.json, eas.json"
routing_capabilities: "mobile-development, security-delivery"
requires: []
optional: []
conflicts: []
supersedes: []
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

> Fuente única para **Correcto / Incorrecto: manejo de existente**: [abrir documento canónico](../.vigilio-docs/standards/engineering/refactoring-existing-code.md).

## ✅ Correcto / ❌ Incorrecto — tarea `mobile-mfe-security-delivery`

✅ **Correcto:** en esta tarea, verificar autorización por recurso y aislar secretos de los logs; remitir la norma compartida al documento propietario.

❌ **Incorrecto:** en esta tarea, confiar en la UI o en el tenant_id enviado por el cliente; inventar pruebas o pegar el mismo procedimiento transversal en varias skills.

## Guías de librerías por versión — lectura antes de usar sus APIs

Las versiones de esta skill no se copian aquí: comprobar lockfile y [versión canónica](../.vigilio-docs/technology/versions.md). Cuando la tarea utilice una de estas dependencias, **abrir el `.md` completo** y consultar su migración ✅/❌ antes de escribir código; el resto no es obligatorio para una tarea que no la utiliza.
- [expo](../.vigilio-docs/technology/libraries/expo.md)
- [expo-updates](../.vigilio-docs/technology/libraries/expo-updates.md)
- [expo-secure-store](../.vigilio-docs/technology/libraries/expo-secure-store.md)

✅ Correcto: versionar el consumidor y seguir los ejemplos de la API instalada; enlazar documento propietario.  ❌ Incorrecto: copiar APIs legacy, duplicar normas en la skill o instalar nuevas dependencias sin gate.

