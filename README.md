# WebScene

WebScene is a TypeScript-first, timeline-based Canvas video composition engine for the web.
It provides After Effects-style primitives (project, compositions, layers, tracks, keyframes, effects) with deterministic rendering and a lightweight runtime designed for browsers.

## Why WebScene

- Build timeline-based motion/video scenes in code.
- Keep output deterministic: same state + same time => same frame.
- Keep runtime lean and open for plugin-based extensions.
- Prepare for a future visual editor by using stable IDs and serializable JSON state.

## Goals

- Canvas2D-first rendering with backend abstraction for future WebGL/WebGPU.
- Strong TypeScript API with JS-friendly usage.
- Frame export and editor-ready state diffs.

## Non-goals (v1)

- Full desktop NLE feature parity.
- Heavy built-in UI or template-specific style systems.
- Guaranteed cross-browser hardware encoding behavior.

## Installation

```bash
npm install webscene
```

## Hello Scene (TypeScript)

```ts
import {
  Project,
  createEngine,
  createSolidLayer,
  createTextLayer,
  Canvas2DBackend,
  CanvasRenderTarget,
  Engine,
} from 'webscene';

const project = Project.create({ width: 1280, height: 720, fps: 30, duration: 5 }).toJSON();
const comp = project.comps[0];

comp.layers.push(
  createSolidLayer({ id: 'bg', name: 'Background', duration: 5, color: [18, 21, 29, 1] }),
  createTextLayer({
    id: 'title',
    name: 'Title',
    duration: 5,
    text: 'Hello WebScene',
    color: [240, 242, 248, 1],
    fontSize: 64,
    fontFamily: 'sans-serif',
  }),
);

const canvas = document.querySelector('canvas')!;
const engine = new Engine({
  project,
  backend: new Canvas2DBackend(),
  target: new CanvasRenderTarget(canvas),
});

engine.renderAt(0);
```

## Hello Scene (JavaScript)

```js
import { Project, Engine, Canvas2DBackend, CanvasRenderTarget, createRectLayer } from 'webscene';

const project = Project.create({ width: 1080, height: 1080, fps: 24, duration: 4 }).toJSON();
project.comps[0].layers.push(
  createRectLayer({
    id: 'box',
    name: 'Box',
    duration: 4,
    width: 320,
    height: 320,
    color: [80, 160, 255, 1],
  }),
);

const canvas = document.querySelector('canvas');
const engine = new Engine({ project, backend: new Canvas2DBackend(), target: new CanvasRenderTarget(canvas) });
engine.renderAt(0);
```

## Concepts Glossary

- `Project`: root config, comps, assets, global markers, revision.
- `Comp`: timeline container with layer stack, optional camera, and comp-level effects.
- `Layer`: render unit (solid, rect, text, image, precomp, custom plugin) with optional `depth` for pseudo-3D parallax.
- `Track`: keyframed value stream bound to layer properties.
- `StatePatch`: set/insert/remove operation for undo/redo-ready workflows.

## Exporting Frames

WebScene ships with frame export and manifest generation:

```ts
import { exportFrames } from 'webscene';

const result = await exportFrames({ engine, canvas, format: 'png' });
console.log(result.manifest.frames.length);
```

`manifest.json` includes fps, dimensions, frame names, and timestamps.

## Experimental WebM Export (WebCodecs)

```ts
import { exportVideoWebM } from 'webscene';

const result = await exportVideoWebM({
  engine,
  canvas,
  experimental: true,
});
```

This path uses WebCodecs + `webm-muxer` and is intentionally marked experimental.

### ffmpeg recipes

Frames + audio to MP4:

```bash
ffmpeg -framerate 30 -i frame_%05d.png -i audio.wav -c:v libx264 -pix_fmt yuv420p -c:a aac output.mp4
```

Frames to WebM:

```bash
ffmpeg -framerate 30 -i frame_%05d.webp -c:v libvpx-vp9 -pix_fmt yuv420p output.webm
```

### ZIP archive plugin (optional)

```ts
import { exportFrames, createZipArchiveBuilder } from 'webscene';

const result = await exportFrames({
  engine,
  canvas,
  archiveBuilder: createZipArchiveBuilder(),
});
```

## Performance Tips

- Reuse engine instances; avoid rebuilding project graph every frame.
- Keep effects stacks minimal on high-res comps.
- Prefer tracks over manual per-frame object reconstruction.
- Use precomps for repeated structures.
- Preload assets through `AssetRegistry.preload`.
- Use camera depth/parallax intentionally; large depth ranges increase overdraw pressure.

## Build Tooling Choice

WebScene uses **tsup** for library bundling (ESM + CJS + d.ts) because it is fast, reliable for TS-first libraries, and keeps config minimal. A separate browser build (`iife`) is provided for `<script>` usage.

## Roadmap

- **v1**: core timeline engine, Canvas2D renderer, effects, assets, player, frame export.
- **v1.5**: experimental WebCodecs workflow and more effect optimizations.
- **v2**: web editor readiness (graph UI, inspector, timeline, history tooling).

## Repository Layout

- `packages/webscene`: core package source.
- `examples`: browser examples.
- `docs`: architecture and guides.

## Development

```bash
npm ci
npm run lint
npm run typecheck
npm run test
npm run build
npm run dev:examples
```

See [CONTRIBUTING.md](./CONTRIBUTING.md) for contribution standards.
