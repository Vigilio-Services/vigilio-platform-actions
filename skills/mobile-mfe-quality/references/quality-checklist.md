# Checklist De Calidad Mobile

## Accessibility

- Semantic role, accessible name, state, and hint where needed.
- Touch targets large enough for the platform; no color-only meaning.
- Screen reader order follows visual/task order.
- Dynamic text does not clip critical actions.
- Keyboard, safe area, reduced motion, and contrast are handled.

## Performance

- Virtualize long lists and provide stable keys.
- Avoid anonymous heavy render work and duplicate server-state copies.
- Size/compress images and defer non-critical loading.
- Keep Query cache and retry policy bounded.
- Measure cold start, interaction latency, frame drops, and memory on representative release builds when they are release criteria.

## Resilience

- AppState and NetInfo drive focus/online behavior once at the provider boundary.
- Mutations expose progress and prevent accidental duplicate submission.
- Offline and timeout errors are distinguishable and recoverable.
- Logout clears sensitive storage and cached user data.
- Backgrounded work is canceled or safely resumable.

## Observability

Capture release, platform, OS, app state, route name, correlation id, and sanitized error category. Never capture auth headers, tokens, presigned URLs, document content, or unrestricted user input.
