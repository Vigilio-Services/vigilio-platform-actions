# Matriz De Pruebas Mobile

| Risk | Minimum evidence |
| --- | --- |
| Pure mapper, schema, utility | Jest unit tests |
| Hook or provider lifecycle | RNTL renderHook/component test with AppState/NetInfo boundary |
| Screen interaction | RNTL behavior test using roles and labels |
| Service and contract parsing | Mocked HTTP boundary with valid/error/malformed payloads |
| Navigation or deep link | Router integration plus device E2E for critical paths |
| SecureStore/session | Adapter tests, logout cleanup, device validation for release |
| Picker/upload | Contract/service tests plus device flow against a safe environment |
| Native permission/config change | Expo checks, native build, and physical/simulator validation |
| Release-critical journey | Maestro on supported target and backend environment |

## Coverage

Use coverage as a floor, not proof of correctness. Branch coverage must include loading, empty, error, denied, offline, retry, and success paths that exist in the feature.

## E2E prerequisites

- Maestro CLI installed.
- Android emulator/device or iOS simulator booted.
- App binary installed with the expected application id.
- Test backend reachable with controlled data.
- Secrets injected by the CI environment, never committed.

If any prerequisite is absent, preserve the test and mark execution pending.
