# Contributing to WebScene

Thanks for contributing.

## Setup

```bash
npm ci
npm run lint
npm run typecheck
npm run test
npm run build
```

## Development workflow

1. Create a focused branch (`feature/<topic>`, `fix/<topic>`, `chore/<topic>`).
2. Make small, scoped commits with specific messages.
3. Keep PRs easy to review.

## Coding standards

- TypeScript-first, strict typing.
- Keep deterministic behavior in core render logic.
- Avoid per-frame allocations in hot paths.
- Prefer explicit naming and readable module boundaries.

## Adding a new layer

1. Extend layer JSON shape in `src/core/schema.ts`.
2. Add factory helper in `src/core/layer-factories.ts`.
3. Add drawing logic in `src/render/canvas2d-backend.ts` or plugin path.
4. Add docs and example usage.

## Adding a new effect

1. Add `EffectHandler` implementation in `src/effects/builtins.ts` or plugin package.
2. Register via `registerBuiltInEffects` or plugin host.
3. Validate performance on large canvases.

## Tests

- Put tests in `packages/webscene/test`.
- Required for math, interpolation, and bug fixes.
- Run with `npm run test`.

## Performance expectations

- Avoid map/filter in hot loops.
- Reuse temporary objects and canvases.
- Cache text/path/noise work where practical.

## Pull requests

PR description should include:

- what changed
- why it changed
- test/build evidence (`npm run lint`, `typecheck`, `test`, `build`)
- screenshots/video for visible rendering changes
