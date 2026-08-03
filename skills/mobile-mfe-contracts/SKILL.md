---
name: mobile-mfe-contracts
description: Integrate mobile HTTP flows using backend-owned browser-safe Zod contracts, derived UI types, React Hook Form, TanStack Query, and native file metadata. Use when adding or changing requests, responses, CRUD forms, pagination, mutations, cache invalidation, authentication payloads, presigned uploads, form adapters, or feature service boundaries.
---

# Mobile MFE Contracts

Preserve one runtime contract across backend and mobile boundaries while keeping transport concerns outside screens.

## Workflow

1. Locate the backend-owned, browser-safe schema and verify its installed version (e.g. `@vigilioyonatan/bus-contracts` — *note: the package name will vary per project*).
2. Import request/response schemas and types from the exact published package version; do not create a local mirror.
3. Derive props, rows and ViewModels with `Pick`, `Omit`, `Partial`, indexed access or intersections.
4. **MAYORMENTE / Standard Case:** Use the published request DTO schema directly in React Hook Form (`zodResolver(productStoreRequestDto)`). Create a local Zod schema (`z.object({ ... })`) ONLY for an exceptionally different native form representation, and map it into the published request DTO.
5. Parse untrusted responses at the service boundary before data reaches components.
6. Connect forms through React Hook Form and the Zod resolver.
7. Put reads and mutations behind TanStack Query keys, explicit invalidation, and retry rules appropriate to idempotency.
8. Translate native file metadata to the backend upload contract without sending binary data through application JSON endpoints.
9. Cover successful and malformed responses, form mapping, validation failures, API errors, and cache behavior.

Read [references/contracts-patterns.md](references/contracts-patterns.md) for the boundary and upload rules.

## Guardrails

- Never import NestJS, database models, AWS SDK, Node built-ins, or server-only environment access into the app.
- Never create `libs/contracts`, duplicate a DTO/schema/enum/interface, or copy contract fields into fixtures/types by hand.
- Never cast an unknown payload into a trusted type without runtime parsing.
- Never store raw server collections in Signals or Zustand.
- Never retry non-idempotent mutations blindly.
- Never log tokens, authorization headers, presigned URLs, file contents, or PII.

## Validation

Run contract governance, TypeScript, relevant service/form tests, and a representative export. Treat backend integration and real uploads as unverified unless the corresponding environment was exercised.
