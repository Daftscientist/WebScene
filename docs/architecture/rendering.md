# Rendering Architecture

## Pipeline overview

1. Resolve project and root comp at time `t`.
2. Sample track bindings onto layer state.
3. Render each active layer into a reusable buffer.
4. Apply effect chain using ping-pong buffers.
5. Composite onto target with transform, opacity, blend mode.

## Determinism

- No `requestAnimationFrame` in core engine.
- Time input is explicit (`renderAt(t)`).
- Cached resources are keyed deterministically.

## Backend abstraction

`RenderBackend` is intentionally small so future WebGL/WebGPU backends can share project and timeline logic.
