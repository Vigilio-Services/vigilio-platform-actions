# Patrones De Contrato Mobile

## Boundary

```text
native input -> form schema -> request DTO -> HTTP client
HTTP response first-party -> ResponseDto type -> query cache -> screen/ViewModel
HTTP response external/high risk -> schema.parse at service boundary -> screen
```

The service boundary owns headers, status handling, JSON decoding, optional risk-based runtime parsing, and error normalization. Screens consume typed contract data. Static assertions are not runtime validation.

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
  RegisterUserRequestDto,
} from '@vigilioyonatan/bus-contracts'; // Note: Package name varies per project

type UserRow = Pick<UserPublicSchema, 'id' | 'email' | 'full_name' | 'status'>;
type RegisterUserDefaults = Partial<Pick<RegisterUserRequestDto, 'role' | 'status'>>;
type UserRowWithActions = UserRow & {
  onEdit: (id: UserRow['id']) => void;
};
```

TypeScript projections do not validate runtime. For first-party APIs use the published
ResponseDto type plus contract tests; for untrusted third-party/high-risk responses,
parse with the published Zod schema once at the HTTP boundary. 

In the **majority of cases (MAYORMENTE)**, pass the published `requestDto` schema directly to React Hook Form (`zodResolver(registerProductRequestDto)`). A local custom form schema (`z.object({ ... })`) is acceptable ONLY when native controls represent the request differently; its mapper must return and parse the published request DTO.

## Native upload

1. Select the file with a native picker.
2. Validate allowed MIME type and configured size locally for feedback.
3. Request a presigned upload contract from the backend.
4. Upload directly from the device using the returned method and required headers.
5. Notify or confirm completion through the backend contract when required.
6. Expire the presigned URL and redact it from telemetry.

Client validation improves UX but never replaces server validation, malware scanning, authorization, or object-key isolation.

## ✅ Correcto / ❌ Incorrecto: manejo de existente

- ✅ **Correcto:** Validar deep links y permisos, controlar secretos, estados offline, accesibilidad y pruebas en dispositivos.
- ❌ **Incorrecto:** Guardar secretos permanentes sin protección, depender sólo del happy path o ignorar permisos/OTA por ambiente.
- **Gate:** no reescribir masivamente código heredado; inspeccionar baseline, tests y locks reales; reportar `NOT_RUN` si falta evidencia. La guía de refactor se consulta en `vigilio-docs/standards/engineering/refactoring-existing-code.md` según la revisión de Docs aprobada (no asumir que el link remoto `main` ya esté publicado).


**Frontera HTTP vigente:** usar la norma canónica `standards/api/http-dtos-and-contracts.md` del snapshot Vigilio. Entradas y salidas HTTP declaran Zod y el tipo inferido en el mismo `*.dto.ts`; entidades usan `domain/schemas/*.schema.ts`; SQL usa ORM/migrations. En Laravel emplear FormRequest o Spatie Data sin duplicación; web/mobile importan solo contratos browser-safe y no `*.doc.ts`. Los exports publicados se migran con compatibilidad y pruebas.
