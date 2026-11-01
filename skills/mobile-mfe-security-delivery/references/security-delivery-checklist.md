# Checklist De Seguridad Y Delivery Mobile

## Client trust boundary

- Assume bundle, network calls, local storage, and public runtime configuration are inspectable.
- Enforce authorization, ownership, limits, MIME checks, and object-key isolation on the backend.
- Use short-lived tokens, revocation, and secure refresh rotation where supported.
- Keep only sensitive session material in SecureStore; avoid AsyncStorage for tokens.

## Native attack surface

- Declare only used permissions and platform usage descriptions.
- Validate deep-link schemes, hosts, routes, and parameters.
- Avoid exporting Android components unless required.
- Sanitize filenames and treat picked files as untrusted.
- Define rooted/jailbroken-device policy only if the risk model justifies it.

## Pipeline

- Pin third-party actions to full commit SHAs.
- Use minimal `permissions`, protected environments, and OIDC where supported.
- Separate development, staging, and production EAS profiles/channels/application ids.
- Produce SBOM, dependency/security scan results, artifact digest, source commit, profile, runtime version, and approver evidence.
- Never expose signing assets or secrets in logs/artifacts.

## OTA

- Match update runtime to compatible native binaries.
- Stage rollout and monitor crashes/startup/critical journeys.
- Keep a kill switch or rollback path and practice it before relying on OTA for recovery.
- Do not use OTA to bypass store review for native-capability changes.

> Fuente única para **Correcto / Incorrecto: manejo de existente**: [abrir documento canónico](../../.vigilio-docs/standards/engineering/refactoring-existing-code.md).

