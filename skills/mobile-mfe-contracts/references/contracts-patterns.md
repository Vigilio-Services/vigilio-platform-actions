# Patrones De Contrato Mobile

## Boundary

```text
native input -> form schema -> request DTO -> HTTP client
HTTP response -> response schema.parse -> query cache -> screen/ViewModel
```

The service boundary owns headers, status handling, JSON decoding, runtime parsing, and error normalization. Screens consume validated domain data.

## DTO discipline

- Import HTTP DTOs, enums and runtime schemas from the exact backend-owned package version.
- Do not create `libs/contracts` or mirror the same fields in a local DTO, interface, enum, fixture type or schema.
- Derive UI-only variants with `Pick`, `Omit`, `Partial`, indexed access, `Readonly` or intersections.
- Use Zod `pick`, `omit`, `partial` or `extend` only to create an explicit boundary projection, never to fork backend rules silently.
- Keep transport nullability distinct from optional form fields.
- Use stable query-key factories and invalidate the narrowest affected scope.
- Retry queries only for transient failures; do not retry authentication or validation errors.

```typescript
import type {
  UserPublicSchema,
  UserStoreRequestDto,
} from '@vigilioyonatan/bus-contracts'; // Note: Package name varies per project

type UserRow = Pick<UserPublicSchema, 'id' | 'email' | 'full_name' | 'status'>;
type UserStoreDefaults = Partial<Pick<UserStoreRequestDto, 'role' | 'status'>>;
type UserRowWithActions = UserRow & {
  onEdit: (id: UserRow['id']) => void;
};
```

TypeScript projections do not validate runtime. Parse the complete untrusted response with the
published Zod schema at the HTTP boundary. 

In the **majority of cases (MAYORMENTE)**, pass the published `requestDto` schema directly to React Hook Form (`zodResolver(productStoreRequestDto)`). A local custom form schema (`z.object({ ... })`) is acceptable ONLY when native controls represent the request differently; its mapper must return and parse the published request DTO.

## Native upload

1. Select the file with a native picker.
2. Validate allowed MIME type and configured size locally for feedback.
3. Request a presigned upload contract from the backend.
4. Upload directly from the device using the returned method and required headers.
5. Notify or confirm completion through the backend contract when required.
6. Expire the presigned URL and redact it from telemetry.

Client validation improves UX but never replaces server validation, malware scanning, authorization, or object-key isolation.
