import {
  Canvas2DBackend,
  CanvasRenderTarget,
  Engine,
  Project,
  createPrecompLayer,
  createRectLayer,
  createSolidLayer,
  createTextLayer,
} from '../../packages/webscene/src/index.ts';

const project = Project.create({ width: 960, height: 540, fps: 30, duration: 8 }).toJSON();
const root = project.comps[0];

const cardComp = {
  id: 'comp-card',
  name: 'Card Comp',
  width: 320,
  height: 200,
  fps: 30,
  duration: 8,
  backgroundColor: [0, 0, 0, 0],
  layers: [],
  tracks: [],
  markers: [],
} as const;

project.comps.push({ ...cardComp, layers: [...cardComp.layers], tracks: [...cardComp.tracks], markers: [] });
const card = project.comps.find((c) => c.id === 'comp-card')!;

card.layers.push(
  createRectLayer({ id: 'card-bg', name: 'card-bg', duration: 8, width: 320, height: 200, color: [36, 44, 66, 1], cornerRadius: 22 }),
  createTextLayer({
    id: 'card-title',
    name: 'card-title',
    duration: 8,
    text: 'Nested Composition',
    fontFamily: 'ui-sans-serif',
    fontSize: 30,
    color: [238, 244, 255, 1],
    maxWidth: 280,
  }),
);
card.layers[1].transform.position = [20, 70];

root.layers.push(createSolidLayer({ id: 'bg', name: 'bg', duration: 8, color: [13, 14, 21, 1] }));

const left = createPrecompLayer({ id: 'card-left', name: 'card-left', duration: 8, compId: 'comp-card' });
left.transform.position = [130, 170];
const right = createPrecompLayer({ id: 'card-right', name: 'card-right', duration: 8, compId: 'comp-card' });
right.transform.position = [510, 170];

root.layers.push(left, right);

const engine = new Engine({
  project,
  backend: new Canvas2DBackend(),
  target: new CanvasRenderTarget(document.getElementById('stage') as HTMLCanvasElement),
});

const start = performance.now();
const loop = (): void => {
  const t = ((performance.now() - start) / 1000) % 8;

  left.transform.rotation = Math.sin(t * 1.2) * 6;
  right.transform.rotation = -Math.sin(t * 1.2) * 6;

  engine.renderAt(t);
  requestAnimationFrame(loop);
};

loop();
