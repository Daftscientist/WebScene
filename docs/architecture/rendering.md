# Rendering Architecture

## Pipeline overview

1. Resolve project and root comp at time `t`.
2. Sample track bindings onto cached layer snapshots.
3. Render each active layer into reusable buffers.
4. Apply layer effect chain using ping-pong buffers.
5. Apply optional comp-level effects.
6. Composite onto target with transform, opacity, blend mode.

## Determinism

- No `requestAnimationFrame` in core engine.
- Time input is explicit (`renderAt(t)`).
- Cached resources are keyed deterministically.
- Noise/grain cache uses deterministic seeded generation.

## Backend abstraction

`RenderBackend` is intentionally small so future WebGL/WebGPU backends can share project and timeline logic.
