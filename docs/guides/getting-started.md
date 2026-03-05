# Getting Started

## Setup

```bash
npm install webscene
```

## 1) Create project and comp content

```ts
const project = Project.create({ width: 1920, height: 1080, fps: 30, duration: 6 }).toJSON();
project.comps[0].layers.push(createSolidLayer({ id: 'bg', name: 'bg', duration: 6, color: [8, 10, 16, 1] }));
```

## 2) Create engine

```ts
const engine = new Engine({
  project,
  backend: new Canvas2DBackend(),
  target: new CanvasRenderTarget(canvas),
});
```

## 3) Render deterministic frame

```ts
engine.renderAt(2.0);
```

## 4) Add animation track

Attach `TrackJSON` to `comp.tracks`, then bind it from a layer via `layer.tracks`.

Example binding path: `transform.position.0`.

## 5) Optional playback controls

```ts
const player = new Player(engine, { loop: true });
createPlayerControls(container, player, { fps: 30, duration: 6 });
```
