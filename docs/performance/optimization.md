# Performance

## Runtime design

- Deterministic frame function: `engine.renderAt(time)`.
- Reused internal canvases for layer/effect passes.
- Text layout cache for wrapped text measurement.
- Path cache for rounded rect primitives.
- Noise texture cache for grain overlays.

## Practical tuning

- Keep precomp depth shallow.
- Minimize expensive effects at 4K.
- Preload assets before playback.
- Avoid rebuilding large project trees every frame.

## Profiling tips

- Use browser performance tools and inspect long tasks.
- Track draw call count from `RenderStats`.
- Measure export throughput with and without effects.
- Run `npm run perf` to enforce baseline track evaluation budgets used by CI.
