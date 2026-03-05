import {
  Canvas2DBackend,
  CanvasRenderTarget,
  Engine,
  Project,
  createRectLayer,
  createSolidLayer,
  createTextLayer,
} from '../../packages/webscene/src/index.ts';

const project = Project.create({ width: 960, height: 540, fps: 30, duration: 6 }).toJSON();
const comp = project.comps[0];

comp.layers.push(createSolidLayer({ id: 'bg', name: 'Background', duration: 6, color: [16, 18, 30, 1] }));

const rect = createRectLayer({
  id: 'hero-rect',
  name: 'Hero Rect',
  duration: 6,
  width: 220,
  height: 220,
  color: [64, 145, 255, 1],
  cornerRadius: 28,
});
rect.transform.position = [120, 160];
rect.effects = [
  {
    id: 'fx-shadow',
    type: 'dropShadow',
    enabled: true,
    params: { blur: 16, offsetX: 8, offsetY: 8, color: [0, 0, 0, 0.45] },
  },
];

const label = createTextLayer({
  id: 'label',
  name: 'Label',
  duration: 6,
  text: 'basic-shapes',
  fontFamily: 'ui-sans-serif',
  fontSize: 38,
  color: [238, 242, 255, 1],
});
label.transform.position = [32, 28];

comp.layers.push(rect, label);

comp.tracks?.push(
  {
    id: 'rect-x',
    name: 'Rectangle X',
    valueType: 'number',
    keyframes: [
      { time: 0, value: 120, easing: 'easeInOutCubic' },
      { time: 3, value: 620, easing: 'easeInOutCubic' },
      { time: 6, value: 120, easing: 'easeInOutCubic' },
    ],
  },
  {
    id: 'rect-rot',
    name: 'Rectangle Rotation',
    valueType: 'number',
    keyframes: [
      { time: 0, value: -8, easing: 'easeInOutSine' },
      { time: 3, value: 8, easing: 'easeInOutSine' },
      { time: 6, value: -8, easing: 'easeInOutSine' },
    ],
  },
);

rect.tracks = [
  { path: 'transform.position.0', trackId: 'rect-x' },
  { path: 'transform.rotation', trackId: 'rect-rot' },
];

const canvas = document.getElementById('stage') as HTMLCanvasElement;
const engine = new Engine({
  project,
  backend: new Canvas2DBackend(),
  target: new CanvasRenderTarget(canvas),
});

const start = performance.now();
const tick = (): void => {
  const t = ((performance.now() - start) / 1000) % 6;
  engine.renderAt(t);
  requestAnimationFrame(tick);
};

tick();
